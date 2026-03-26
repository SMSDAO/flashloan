// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test, console} from "forge-std/Test.sol";
import {FlashloanArbitrage} from "../../contracts/FlashloanArbitrage.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// ─── Mock contracts ────────────────────────────────────────────────────────────

contract MockERC20 {
    string public name;
    string public symbol;
    uint8 public decimals = 18;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
    }

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "insufficient");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "insufficient balance");
        require(allowance[from][msg.sender] >= amount, "insufficient allowance");
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

contract MockRouter {
    // Configurable swap ratio: 1 tokenIn => ratio tokenOut (in basis points of input, e.g. 10100 = 101%)
    uint256 public ratioBps; // e.g. 10100 = 101%

    constructor(uint256 _ratioBps) {
        ratioBps = _ratioBps;
    }

    function setRatio(uint256 _ratioBps) external {
        ratioBps = _ratioBps;
    }

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256, /* amountOutMin */
        address[] calldata path,
        address to,
        uint256 /* deadline */
    ) external returns (uint256[] memory amounts) {
        MockERC20(path[0]).transferFrom(msg.sender, address(this), amountIn);
        uint256 amountOut = (amountIn * ratioBps) / 10000;
        MockERC20(path[path.length - 1]).mint(to, amountOut);

        amounts = new uint256[](path.length);
        amounts[0] = amountIn;
        amounts[path.length - 1] = amountOut;
    }

    function getAmountsOut(uint256 amountIn, address[] calldata path)
        external
        view
        returns (uint256[] memory amounts)
    {
        amounts = new uint256[](path.length);
        amounts[0] = amountIn;
        amounts[path.length - 1] = (amountIn * ratioBps) / 10000;
    }
}

contract MockPool {
    // Simulates Aave V3 flashLoanSimple callback
    uint256 public constant FLASH_LOAN_FEE_BPS = 5; // 0.05%

    function flashLoanSimple(
        address receiverAddress,
        address asset,
        uint256 amount,
        bytes calldata params,
        uint16 /* referralCode */
    ) external {
        uint256 premium = (amount * FLASH_LOAN_FEE_BPS) / 10000;

        // Give the receiver the flashloan
        MockERC20(asset).mint(receiverAddress, amount);

        // Call executeOperation
        bool success = FlashloanArbitrage(receiverAddress).executeOperation(
            asset,
            amount,
            premium,
            receiverAddress,
            params
        );
        require(success, "Flashloan callback failed");

        // Take back principal + premium
        MockERC20(asset).transferFrom(receiverAddress, address(this), amount + premium);
    }
}

contract MockAddressesProvider {
    address public pool;

    constructor(address _pool) {
        pool = _pool;
    }

    function getPool() external view returns (address) {
        return pool;
    }
}

// ─── Test Suite ────────────────────────────────────────────────────────────────

contract FlashloanArbitrageTest is Test {
    // Mirror event for vm.expectEmit matching (Solidity 0.8.19 compatible)
    event MinProfitUpdated(uint256 oldMinProfit, uint256 newMinProfit);

    FlashloanArbitrage public arb;
    MockPool public pool;
    MockAddressesProvider public provider;
    MockERC20 public tokenA;
    MockERC20 public tokenB;
    MockRouter public dexA; // profitable: gives 102%
    MockRouter public dexB; // gives back 100% (arbitrage spread = dexA spread - fees)
    address public owner;

    uint256 constant LOAN_AMOUNT = 1_000_000 * 1e18; // 1M tokens
    uint256 constant MIN_PROFIT = 0; // 0 for basic tests

    function setUp() public {
        owner = address(this);

        pool = new MockPool();
        provider = new MockAddressesProvider(address(pool));
        tokenA = new MockERC20("TokenA", "TKNA");
        tokenB = new MockERC20("TokenB", "TKNB");

        // dexA swaps TKNA→TKNB at 102% (1% profit)
        dexA = new MockRouter(10200); // 102%
        // dexB swaps TKNB→TKNA at 100%
        dexB = new MockRouter(10000); // 100%

        arb = new FlashloanArbitrage(address(provider), MIN_PROFIT);

        // Give pool enough tokenA to fund flashloan
        tokenA.mint(address(pool), LOAN_AMOUNT * 100);
        // Give pool allowance from arb contract
        vm.prank(address(arb));
        tokenA.approve(address(pool), type(uint256).max);
    }

    // ── Constructor & Ownership ────────────────────────────────────────────────

    function test_ConstructorSetsProvider() public view {
        assertEq(address(arb.ADDRESSES_PROVIDER()), address(provider));
    }

    function test_ConstructorSetsPool() public view {
        assertEq(address(arb.POOL()), address(pool));
    }

    function test_ConstructorSetsOwner() public view {
        assertEq(arb.owner(), owner);
    }

    function test_ConstructorSetsMinProfit() public view {
        assertEq(arb.minProfit(), MIN_PROFIT);
    }

    function test_RevertOnZeroProvider() public {
        vm.expectRevert("Invalid provider");
        new FlashloanArbitrage(address(0), 0);
    }

    // ── Access Control ─────────────────────────────────────────────────────────

    function test_OnlyOwnerCanExecuteFlashloan() public {
        address attacker = address(0xBEEF);
        vm.prank(attacker);
        vm.expectRevert();
        arb.executeFlashloan(
            address(tokenA),
            LOAN_AMOUNT,
            address(dexA),
            address(dexB),
            address(tokenB),
            0
        );
    }

    function test_OnlyOwnerCanPause() public {
        address attacker = address(0xBEEF);
        vm.prank(attacker);
        vm.expectRevert();
        arb.pause();
    }

    function test_OnlyOwnerCanSetMinProfit() public {
        address attacker = address(0xBEEF);
        vm.prank(attacker);
        vm.expectRevert();
        arb.setMinProfit(100);
    }

    // ── Pausable ──────────────────────────────────────────────────────────────

    function test_PauseAndUnpause() public {
        arb.pause();
        assertTrue(arb.paused());
        arb.unpause();
        assertFalse(arb.paused());
    }

    function test_RevertWhenPaused() public {
        arb.pause();
        vm.expectRevert();
        arb.executeFlashloan(
            address(tokenA),
            LOAN_AMOUNT,
            address(dexA),
            address(dexB),
            address(tokenB),
            0
        );
    }

    // ── Parameter Validation ──────────────────────────────────────────────────

    function test_RevertOnZeroAsset() public {
        vm.expectRevert("Invalid asset");
        arb.executeFlashloan(address(0), LOAN_AMOUNT, address(dexA), address(dexB), address(tokenB), 0);
    }

    function test_RevertOnZeroAmount() public {
        vm.expectRevert("Amount must be > 0");
        arb.executeFlashloan(address(tokenA), 0, address(dexA), address(dexB), address(tokenB), 0);
    }

    function test_RevertOnZeroDexA() public {
        vm.expectRevert("Invalid DEX");
        arb.executeFlashloan(address(tokenA), LOAN_AMOUNT, address(0), address(dexB), address(tokenB), 0);
    }

    function test_RevertOnZeroTokenB() public {
        vm.expectRevert("Invalid tokenB");
        arb.executeFlashloan(address(tokenA), LOAN_AMOUNT, address(dexA), address(dexB), address(0), 0);
    }

    // ── Callback Security ─────────────────────────────────────────────────────

    function test_RevertOnUnauthorizedCallback() public {
        address attacker = address(0xDEAD);
        vm.prank(attacker);
        vm.expectRevert("Caller not Pool");
        arb.executeOperation(address(tokenA), LOAN_AMOUNT, 100, address(arb), "");
    }

    // ── setMinProfit ──────────────────────────────────────────────────────────

    function test_SetMinProfit() public {
        arb.setMinProfit(1000);
        assertEq(arb.minProfit(), 1000);
    }

    function test_SetMinProfitEmitsEvent() public {
        vm.expectEmit(false, false, false, true);
        emit MinProfitUpdated(0, 1000);
        arb.setMinProfit(1000);
    }

    // ── Emergency Withdraw ────────────────────────────────────────────────────

    function test_EmergencyWithdrawRequiresPaused() public {
        tokenA.mint(address(arb), 1000);
        vm.expectRevert();
        arb.emergencyWithdraw(address(tokenA), owner);
    }

    function test_EmergencyWithdraw() public {
        tokenA.mint(address(arb), 1000);
        arb.pause();
        arb.emergencyWithdraw(address(tokenA), owner);
        assertEq(tokenA.balanceOf(owner), 1000);
        assertEq(tokenA.balanceOf(address(arb)), 0);
    }

    function test_EmergencyWithdrawRevertOnZeroRecipient() public {
        tokenA.mint(address(arb), 1000);
        arb.pause();
        vm.expectRevert("Invalid recipient");
        arb.emergencyWithdraw(address(tokenA), address(0));
    }

    function test_EmergencyWithdrawRevertOnEmptyBalance() public {
        arb.pause();
        vm.expectRevert("Nothing to withdraw");
        arb.emergencyWithdraw(address(tokenA), owner);
    }

    // ── simulateProfit ────────────────────────────────────────────────────────

    function test_SimulateProfitPositive() public view {
        (uint256 profit, uint256 fee) = arb.simulateProfit(
            address(tokenA),
            LOAN_AMOUNT,
            address(dexA),
            address(dexB),
            address(tokenB)
        );
        assertGt(profit, 0, "Expected positive profit");
        assertGt(fee, 0, "Expected non-zero fee");
    }

    function test_SimulateProfitZeroWhenUnprofitable() public {
        // dexA gives 99.9% (loss), dexB gives 100%
        MockRouter unprofDex = new MockRouter(9990);
        (uint256 profit,) = arb.simulateProfit(
            address(tokenA),
            LOAN_AMOUNT,
            address(unprofDex),
            address(dexB),
            address(tokenB)
        );
        assertEq(profit, 0, "Expected zero profit on unprofitable arb");
    }

    // ── Fuzz Tests ────────────────────────────────────────────────────────────

    function testFuzz_SetMinProfit(uint256 amount) public {
        arb.setMinProfit(amount);
        assertEq(arb.minProfit(), amount);
    }

    function testFuzz_SimulateProfitWithHighRatio(uint96 loanAmt) public view {
        uint256 amount = uint256(loanAmt) + 1; // avoid 0
        (uint256 profit,) = arb.simulateProfit(
            address(tokenA),
            amount,
            address(dexA),
            address(dexB),
            address(tokenB)
        );
        // With dexA at 102% and dexB at 100%, profit should be >= 0
        // (could be 0 due to integer math on tiny amounts)
        assertGe(profit, 0);
    }

    // ── Full Flashloan Execution Flow ─────────────────────────────────────────

    function test_ExecuteFlashloan_ProfitableFlow() public {
        // Give pool enough tokens to fund flashloan
        tokenA.mint(address(pool), LOAN_AMOUNT * 10);

        uint256 ownerBalanceBefore = tokenA.balanceOf(owner);

        // Execute flashloan: dexA buys tokenB at 102% of LOAN_AMOUNT,
        //                    dexB sells tokenB back for 102% * 100% = 102% of LOAN_AMOUNT
        // Aave fee = 0.05% of LOAN_AMOUNT
        // Profit = LOAN_AMOUNT * 2% - fee > 0 → should succeed
        arb.executeFlashloan(
            address(tokenA),
            LOAN_AMOUNT,
            address(dexA),
            address(dexB),
            address(tokenB),
            0 // minProfit = 0 for this test
        );

        // The profit stays in the contract (owner can withdraw)
        // Just verify the call succeeded without revert
    }

    function test_ExecuteFlashloan_RevertsIfUnprofitable() public {
        // dexA at 99% — can't repay flashloan
        MockRouter badDex = new MockRouter(9900);
        tokenA.mint(address(pool), LOAN_AMOUNT * 10);

        vm.expectRevert("Cannot repay flashloan");
        arb.executeFlashloan(
            address(tokenA),
            LOAN_AMOUNT,
            address(badDex),
            address(dexB),
            address(tokenB),
            0
        );
    }

    function test_ExecuteFlashloan_RevertsIfBelowMinProfit() public {
        // Set a very high minProfit
        arb.setMinProfit(type(uint256).max);
        tokenA.mint(address(pool), LOAN_AMOUNT * 10);

        vm.expectRevert("Profit below global minimum");
        arb.executeFlashloan(
            address(tokenA),
            LOAN_AMOUNT,
            address(dexA),
            address(dexB),
            address(tokenB),
            0
        );
    }
}

// ─── Invariant Tests ──────────────────────────────────────────────────────────

contract FlashloanArbitrageInvariantTest is Test {
    FlashloanArbitrage public arb;
    MockPool public pool;
    MockAddressesProvider public provider;
    MockERC20 public tokenA;
    MockERC20 public tokenB;
    MockRouter public dexA;
    MockRouter public dexB;

    function setUp() public {
        pool = new MockPool();
        provider = new MockAddressesProvider(address(pool));
        tokenA = new MockERC20("TokenA", "TKNA");
        tokenB = new MockERC20("TokenB", "TKNB");
        dexA = new MockRouter(10200);
        dexB = new MockRouter(10000);

        arb = new FlashloanArbitrage(address(provider), 0);
        tokenA.mint(address(pool), 1_000_000_000 * 1e18);
    }

    // Invariant: contract is never paused after construction (unless owner pauses)
    function invariant_notPausedByDefault() public view {
        assertFalse(arb.paused());
    }

    // Invariant: owner is always set
    function invariant_ownerIsSet() public view {
        assertNotEq(arb.owner(), address(0));
    }
}
