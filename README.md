# Morty

A local mortgage and investment analysis app. Track how rate changes, extra payments, redraws, and deposits affect your mortgage, plus compare investment opportunities vs mortgage payments.

![Morty Logo](public/morty-logo.png)

## Bugs
- 

## Features

### 🏠 **Comprehensive Mortgage Analysis**
- Enter loan amount, interest rate, term (years + months), and payment day
- Real-time calculations with instant updates
- Support for offset/redraw accounts

### 📈 **Investment Analysis & Comparison**
- **Multiple investment types** - Shares, property, bonds, ETFs, crypto, savings, term deposits
- **Detailed calculations** - Capital growth, dividend yield, tax implications
- **Investment vs Mortgage** - Compare returns from investing vs paying down mortgage
- **Break-even analysis** - Find the return rate needed to beat mortgage payments
- **Share breakdown** - Separate capital growth and dividend values for shares
- **Edit investments** - Full CRUD operations for your investment portfolio

### 📅 **Timeline Events**
Add historic or future changes to see their impact:
- **Interest rate changes** - Model rate fluctuations
- **Extra payments** - See the effect of additional payments
- **Redraws** - Borrow against equity
- **Deposits** - Lump sum payments
- **Refinancing** - New loan terms
- **Recasting** - Lump sum with payment recalculation
- **Balance adjustments** - Sync with actual balances
- **Offset adjustments** - Track offset account changes
- **Repayment changes** - Modify ongoing payment amounts

### 📊 **Visual Analysis**
- **Interactive charts** - Balance and interest tracking over time
- **Quarterly summary table** - Detailed breakdown by quarter
- **Key metrics** - Payoff date, interest saved, total payments
- **Collapsible analysis** - Clean interface with detailed insights on demand
- **Tab interface** - Separate mortgage and investment analysis

### 💾 **Data Management**
- **Automatic saving** - Your work persists between sessions
- **Export functionality** - Download your analysis as JSON
- **Local storage** - No internet required, completely private

## Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/morty.git
   cd morty
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   - The app will automatically open at `http://localhost:3000`
   - For desktop app experience, you can also run:
   ```bash
   npm run electron-dev
   ```

### Building for Production

**Option 1: Static Web Server (Recommended for Local Use)**
```bash
# Build the production version
npm run build

# Install a simple web server (one-time setup)
npm install -g serve

# Serve the application locally
serve -s build -p 3000
```
Then open `http://localhost:3000` in your browser and bookmark it for easy access.

**Option 2: Desktop App**
```bash
npm run dist
```

**Option 3: Python Web Server (if Python is installed)**
```bash
# After building
npm run build
cd build

# Python 3
python -m http.server 3000

# Python 2  
python -m SimpleHTTPServer 3000
```

## Usage

### Basic Setup
1. **Enter mortgage details** - Click the top bar to edit loan amount, rate, term, and payment day
2. **Add timeline events** - Click "Add Event" to model changes over time
3. **View results** - Key metrics appear in the top bar automatically
4. **Detailed analysis** - Click "Show Analysis" for charts and quarterly breakdown

### Investment Analysis
1. **Switch to Investments tab** - Click the "Investments" tab at the top
2. **Add investments** - Click "Add Investment" to enter investment details
3. **Compare returns** - See automatic comparison vs mortgage payments
4. **Edit investments** - Use the "Edit" button to modify existing investments
5. **Review recommendations** - Check break-even analysis and recommendations

### Timeline Events
- **Rate changes** - Model interest rate fluctuations
- **Payment adjustments** - Change your monthly payment amount
- **Lump sum payments** - See the impact of extra payments
- **Offset account** - Track how offset balances reduce interest

### Advanced Features
- **Offset accounts** - Automatically calculates interest on effective balance
- **Payment variations** - Extra payments automatically flow to offset account
- **Quarterly reporting** - Detailed breakdown of interest and payments by quarter
- **Investment breakdown** - For shares, see separate capital growth and dividend values
- **Tax calculations** - Investment analysis includes capital gains and income tax
- **Export/backup** - Save your analysis for sharing or backup

## Technology Stack

- **React** - User interface framework
- **Recharts** - Data visualization
- **Electron** - Desktop app framework (optional)
- **Local Storage** - Data persistence

## Key Benefits

- **100% Local** - No internet required, your data stays private
- **Real-time** - Instant calculations as you make changes
- **Comprehensive** - Models complex mortgage scenarios and investment comparisons
- **Visual** - Charts and tables make trends easy to understand
- **Flexible** - Supports various mortgage types, events, and investment options
- **Tax-aware** - Investment calculations include tax implications
- **Decision support** - Clear recommendations for invest vs pay mortgage decisions

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions:
1. Check the [Issues](https://github.com/yourusername/morty/issues) page
2. Create a new issue with detailed information
3. Include screenshots if applicable

---

**Meet Morty - your friendly mortgage analysis companion! 🤓**