// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/security/Pausable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// Aave V3 interfaces (inline for self-contained compilation)
interface IPoolAddressesProvider {
    function getPool() external view returns (address);
}

interface IPool {
    function flashLoanSimple(
        address receiverAddress,
        address asset,
        uint256 amount,
        bytes calldata params,
        uint16 referralCode
    ) external;
}

interface IFlashLoanSimpleReceiver {
    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external returns (bool);
}

// Minimal Uniswap V2 Router interface
interface IUniswapV2Router {
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);

    function getAmountsOut(uint256 amountIn, address[] calldata path)
        external
        view
        returns (uint256[] memory amounts);
}

/**
 * @title FlashloanArbitrage
 * @notice Executes flashloan-based arbitrage between two DEXes using Aave V3
 * @dev Implements IFlashLoanSimpleReceiver for Aave V3 callback
 */
contract FlashloanArbitrage is
    IFlashLoanSimpleReceiver,
    ReentrancyGuard,
    Pausable,
    Ownable
{
    using SafeERC20 for IERC20;

    // ─── State ────────────────────────────────────────────────────────────────

    IPoolAddressesProvider public immutable ADDRESSES_PROVIDER;
    IPool public immutable POOL;

    uint256 public minProfit; // Minimum profit in token units (after fees)

    // ─── Events ───────────────────────────────────────────────────────────────

    event FlashloanExecuted(
        address indexed asset,
        uint256 amount,
        uint256 premium,
        uint256 profit
    );
    event ArbitrageCompleted(
        address indexed dexA,
        address indexed dexB,
        address indexed asset,
        uint256 amountIn,
        uint256 amountOut
    );
    event EmergencyWithdraw(address indexed token, uint256 amount, address to);
    event MinProfitUpdated(uint256 oldMinProfit, uint256 newMinProfit);

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor(address _addressesProvider, uint256 _minProfit)
    {
        require(_addressesProvider != address(0), "Invalid provider");
        ADDRESSES_PROVIDER = IPoolAddressesProvider(_addressesProvider);
        POOL = IPool(IPoolAddressesProvider(_addressesProvider).getPool());
        minProfit = _minProfit;
    }

    // ─── External / Public ────────────────────────────────────────────────────

    /**
     * @notice Initiates a flashloan arbitrage between dexA and dexB
     * @param asset   Token to borrow
     * @param amount  Amount to borrow
     * @param dexA    Buy DEX router address (buy asset on dexA)
     * @param dexB    Sell DEX router address (sell asset on dexB)
     * @param tokenB  Intermediate token for the swap path (asset -> tokenB -> asset)
     * @param _minProfit Minimum acceptable profit for this execution
     */
    function executeFlashloan(
        address asset,
        uint256 amount,
        address dexA,
        address dexB,
        address tokenB,
        uint256 _minProfit
    ) external onlyOwner nonReentrant whenNotPaused {
        require(asset != address(0), "Invalid asset");
        require(amount > 0, "Amount must be > 0");
        require(dexA != address(0) && dexB != address(0), "Invalid DEX");
        require(tokenB != address(0), "Invalid tokenB");

        bytes memory params = abi.encode(dexA, dexB, tokenB, _minProfit);

        POOL.flashLoanSimple(
            address(this),
            asset,
            amount,
            params,
            0 // referralCode
        );
    }

    /**
     * @notice Aave V3 flashloan callback — executes arbitrage
     * @dev nonReentrant is intentionally NOT used here because this function
     *      is called by the Aave Pool during the flashLoanSimple execution
     *      which is already guarded by nonReentrant in executeFlashloan.
     *      Security is enforced via msg.sender == POOL and initiator == address(this).
     */
    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external override returns (bool) {
        require(msg.sender == address(POOL), "Caller not Pool");
        require(initiator == address(this), "Initiator not self");

        (address dexA, address dexB, address tokenB, uint256 _minProfit) =
            abi.decode(params, (address, address, address, uint256));

        uint256 initialBalance = IERC20(asset).balanceOf(address(this));

        // ── Step 1: Swap asset → tokenB on dexA ──────────────────────────────
        IERC20(asset).safeApprove(dexA, 0);
        IERC20(asset).safeApprove(dexA, amount);

        address[] memory pathA = new address[](2);
        pathA[0] = asset;
        pathA[1] = tokenB;

        uint256[] memory amountsA = IUniswapV2Router(dexA)
            .swapExactTokensForTokens(
                amount,
                1, // amountOutMin — real value enforced by minProfit at end
                pathA,
                address(this),
                block.timestamp + 300
            );

        uint256 tokenBAmount = amountsA[amountsA.length - 1];

        // ── Step 2: Swap tokenB → asset on dexB ──────────────────────────────
        IERC20(tokenB).safeApprove(dexB, 0);
        IERC20(tokenB).safeApprove(dexB, tokenBAmount);

        address[] memory pathB = new address[](2);
        pathB[0] = tokenB;
        pathB[1] = asset;

        uint256[] memory amountsB = IUniswapV2Router(dexB)
            .swapExactTokensForTokens(
                tokenBAmount,
                1,
                pathB,
                address(this),
                block.timestamp + 300
            );

        uint256 assetReceived = amountsB[amountsB.length - 1];

        // ── Step 3: Verify profit invariant ──────────────────────────────────
        uint256 totalDebt = amount + premium;
        require(assetReceived >= totalDebt, "Cannot repay flashloan");

        uint256 profit = assetReceived - totalDebt;
        require(profit >= _minProfit, "Profit below minimum");
        require(profit >= minProfit, "Profit below global minimum");

        emit ArbitrageCompleted(dexA, dexB, asset, amount, assetReceived);

        // ── Step 4: Approve Aave to pull repayment ────────────────────────────
        IERC20(asset).safeApprove(address(POOL), 0);
        IERC20(asset).safeApprove(address(POOL), totalDebt);

        uint256 finalBalance = IERC20(asset).balanceOf(address(this));
        // Invariant: finalBalance >= initialBalance + fee (Aave premium)
        require(
            finalBalance >= initialBalance + premium,
            "Invariant: balance must cover fee"
        );

        emit FlashloanExecuted(asset, amount, premium, profit);

        return true;
    }

    // ─── View helpers ─────────────────────────────────────────────────────────

    /**
     * @notice Simulate expected profit for given parameters (off-chain read)
     */
    function simulateProfit(
        address asset,
        uint256 amount,
        address dexA,
        address dexB,
        address tokenB
    ) external view returns (uint256 expectedProfit, uint256 fee) {
        // Aave V3 flash fee = 0.05% (5 bps)
        fee = (amount * 5) / 10000;

        address[] memory pathA = new address[](2);
        pathA[0] = asset;
        pathA[1] = tokenB;

        uint256[] memory amountsA = IUniswapV2Router(dexA).getAmountsOut(
            amount,
            pathA
        );
        uint256 tokenBAmount = amountsA[amountsA.length - 1];

        address[] memory pathB = new address[](2);
        pathB[0] = tokenB;
        pathB[1] = asset;

        uint256[] memory amountsB = IUniswapV2Router(dexB).getAmountsOut(
            tokenBAmount,
            pathB
        );
        uint256 assetReceived = amountsB[amountsB.length - 1];

        uint256 totalDebt = amount + fee;
        if (assetReceived > totalDebt) {
            expectedProfit = assetReceived - totalDebt;
        } else {
            expectedProfit = 0;
        }
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function setMinProfit(uint256 _minProfit) external onlyOwner {
        emit MinProfitUpdated(minProfit, _minProfit);
        minProfit = _minProfit;
    }

    /**
     * @notice Emergency withdrawal of stuck tokens
     */
    function emergencyWithdraw(address token, address to)
        external
        onlyOwner
        whenPaused
    {
        require(to != address(0), "Invalid recipient");
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance > 0, "Nothing to withdraw");
        IERC20(token).safeTransfer(to, balance);
        emit EmergencyWithdraw(token, balance, to);
    }

    // ─── Required by IFlashLoanSimpleReceiver ─────────────────────────────────

    function ADDRESSES_PROVIDER_VIEW()
        external
        view
        returns (IPoolAddressesProvider)
    {
        return ADDRESSES_PROVIDER;
    }

    function POOL_VIEW() external view returns (IPool) {
        return POOL;
    }
}
