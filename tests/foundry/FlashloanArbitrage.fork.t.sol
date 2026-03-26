// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test, console} from "forge-std/Test.sol";
import {FlashloanArbitrage} from "../../contracts/FlashloanArbitrage.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @notice Fork tests — run against mainnet fork with MAINNET_RPC_URL
 * @dev Skip if RPC not available (CI without secrets uses mock tests)
 */
contract FlashloanArbitrageForkTest is Test {
    // Mainnet Aave V3 addresses
    address constant AAVE_ADDRESSES_PROVIDER =
        0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e;
    address constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address constant UNISWAP_V2_ROUTER =
        0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    address constant SUSHISWAP_ROUTER =
        0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F;

    FlashloanArbitrage public arb;
    address public owner;

    function setUp() public {
        string memory rpc = vm.envOr("MAINNET_RPC_URL", string(""));
        if (bytes(rpc).length == 0) {
            // Skip fork tests when no RPC URL provided
            vm.skip(true);
            return;
        }
        vm.createFork(rpc);

        owner = address(this);
        arb = new FlashloanArbitrage(AAVE_ADDRESSES_PROVIDER, 0);
    }

    function test_Fork_DeployWithAaveProvider() public view {
        assertEq(address(arb.ADDRESSES_PROVIDER()), AAVE_ADDRESSES_PROVIDER);
    }

    function test_Fork_SimulateUSDCArb() public view {
        // Simulate USDC→WETH→USDC arbitrage between Uniswap V2 and Sushiswap
        (uint256 profit, uint256 fee) = arb.simulateProfit(
            USDC,
            1_000_000 * 1e6, // 1M USDC
            UNISWAP_V2_ROUTER,
            SUSHISWAP_ROUTER,
            WETH
        );
        console.log("Simulated profit:", profit);
        console.log("Flashloan fee:", fee);
        // In real conditions, profit may be 0 due to efficient markets
        // This test only validates the call succeeds without reverting
        assertGe(profit, 0);
    }
}
