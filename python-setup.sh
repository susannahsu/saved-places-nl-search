#!/bin/bash

# Optional: Python Virtual Environment Setup
# This is NOT required for the current project
# Only use if you plan to add Python backend services

echo "⚠️  WARNING: This project uses Node.js, not Python"
echo "Python setup is optional and not currently needed"
echo ""
read -p "Do you still want to create a Python virtual environment? (y/n) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "Creating Python virtual environment..."
    
    # Create virtual environment
    python3 -m venv venv
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Upgrade pip
    pip install --upgrade pip
    
    # Install dependencies (if requirements.txt has packages)
    # pip install -r requirements.txt
    
    echo ""
    echo "✅ Python virtual environment created!"
    echo ""
    echo "To activate: source venv/bin/activate"
    echo "To deactivate: deactivate"
    echo ""
    echo "⚠️  Remember: The main project still uses Node.js"
    echo "Run 'npm install' and 'npm run dev' for the web app"
else
    echo ""
    echo "Skipping Python setup."
    echo "Run 'npm install' to set up the Node.js project."
fi
