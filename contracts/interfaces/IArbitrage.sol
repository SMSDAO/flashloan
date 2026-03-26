// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IArbitrage {
    function executeFlashloan(
        address asset,
        uint256 amount,
        address dexA,
        address dexB,
        address tokenB,
        uint256 minProfit
    ) external;

    function simulateProfit(
        address asset,
        uint256 amount,
        address dexA,
        address dexB,
        address tokenB
    ) external view returns (uint256 expectedProfit, uint256 fee);

    function pause() external;
    function unpause() external;
    function setMinProfit(uint256 _minProfit) external;
    function emergencyWithdraw(address token, address to) external;
}
