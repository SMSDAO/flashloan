# Define the base directory
\ = \"D:\studiodefi\flashloan\frontend\"

# Create the 'pages' directory
\ = Join-Path \ \"pages\"
if (-Not (Test-Path \)) {
    New-Item -ItemType Directory -Path \ -Force
}

# Create the 'index.js' file in the 'pages' directory
\ = Join-Path \ \"index.js\"
Set-Content -Path \ -Value @\"
export default function Home() {
    return (
        <div>
            <h1>Welcome to Flashloan Frontend</h1>
        </div>
    );
}
\"@

# Create the 'styles' directory
\ = Join-Path \ \"styles\"
if (-Not (Test-Path \)) {
    New-Item -ItemType Directory -Path \ -Force
}

# Create the 'globals.css' file in the 'styles' directory
\ = Join-Path \ \"globals.css\"
Set-Content -Path \ -Value @\"
/* Add your global styles here */
body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 0;
}
\"@

# Output success message
Write-Host \"Directory structure and files created successfully!\"
