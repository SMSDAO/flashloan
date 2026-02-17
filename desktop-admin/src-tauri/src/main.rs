// Prevents additional console window on Windows in release
#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use tauri::Manager;
use std::sync::Mutex;

// State management
struct AppState {
    connected_bots: Mutex<Vec<String>>,
    execution_logs: Mutex<Vec<String>>,
}

// Commands callable from frontend
#[tauri::command]
fn execute_bot(bot_id: String, config: String) -> Result<String, String> {
    println!("Executing bot: {} with config: {}", bot_id, config);
    Ok(format!("Bot {} executed successfully", bot_id))
}

#[tauri::command]
fn get_bots(state: tauri::State<AppState>) -> Result<Vec<String>, String> {
    let bots = state.connected_bots.lock().unwrap();
    Ok(bots.clone())
}

#[tauri::command]
fn add_bot(bot_id: String, state: tauri::State<AppState>) -> Result<(), String> {
    let mut bots = state.connected_bots.lock().unwrap();
    bots.push(bot_id.clone());
    println!("Bot added: {}", bot_id);
    Ok(())
}

#[tauri::command]
fn remove_bot(bot_id: String, state: tauri::State<AppState>) -> Result<(), String> {
    let mut bots = state.connected_bots.lock().unwrap();
    bots.retain(|b| b != &bot_id);
    println!("Bot removed: {}", bot_id);
    Ok(())
}

#[tauri::command]
fn get_execution_logs(state: tauri::State<AppState>) -> Result<Vec<String>, String> {
    let logs = state.execution_logs.lock().unwrap();
    Ok(logs.clone())
}

#[tauri::command]
fn update_gas_fees(max_fee: u64, priority_multiplier: f64) -> Result<String, String> {
    println!("Updating gas fees: max={}, multiplier={}", max_fee, priority_multiplier);
    Ok(format!("Gas fees updated: max={}, multiplier={}", max_fee, priority_multiplier))
}

#[tauri::command]
fn get_profitability_metrics() -> Result<String, String> {
    // In production, this would fetch real metrics
    let metrics = serde_json::json!({
        "totalProfit": 15678.50,
        "totalVolume": 1250000.0,
        "executionCount": 2543,
        "successRate": 98.5,
        "avgProfitPerTx": 6.16,
        "topStrategy": "Turbo",
        "topPool": "SOL-USDC"
    });
    
    Ok(metrics.to_string())
}

fn main() {
    let app_state = AppState {
        connected_bots: Mutex::new(vec![
            "Turbo Bot".to_string(),
            "Ninja Bot".to_string(),
            "Sniper Bot".to_string(),
        ]),
        execution_logs: Mutex::new(vec![]),
    };

    tauri::Builder::default()
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            execute_bot,
            get_bots,
            add_bot,
            remove_bot,
            get_execution_logs,
            update_gas_fees,
            get_profitability_metrics
        ])
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                let window = app.get_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
