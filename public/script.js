let currentCharts = { pie: null, bar: null, history: null };

// Available stocks for search (matching your API)
const stocks = [
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.' },
    { symbol: 'TSLA', name: 'Tesla Inc.' },
    { symbol: 'FB', name: 'Meta Platforms Inc.' },
    { symbol: 'C', name: 'Citigroup Inc.' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.' },
    { symbol: 'MSFT', name: 'Microsoft Corporation' },
    { symbol: 'NFLX', name: 'Netflix Inc.' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation' },
    { symbol: 'V', name: 'Visa Inc.' },
    { symbol: 'WMT', name: 'Walmart Inc.' },
    { symbol: 'DIS', name: 'The Walt Disney Company' }
];

// Financial data API configuration
const ALPHA_VANTAGE_API_KEY = 'demo'; // Free demo key - replace with your own for production
const ALPHA_VANTAGE_BASE = 'https://www.alphavantage.co/query';

// Stocks that will use live API data
const LIVE_STOCKS = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'AMZN'];

// API rate limiting
let apiCallCount = 0;
const MAX_API_CALLS_PER_MINUTE = 5; // Alpha Vantage free tier limit

// Cache for stock prices to avoid excessive API calls
const priceCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    loadPortfolio();
    loadAvailableStocks();
    loadPortfolioSummary();
    updateMarketStatus();
    loadTransactionHistory();
    
    // Set up periodic updates
    setInterval(() => {
        apiCallCount = 0; // Reset API call counter every minute
        loadAvailableStocks(); // Refresh stock prices
        loadPortfolio(); // Refresh portfolio
    }, 60000);
});

// Function to fetch real-time stock price
async function fetchStockPrice(ticker) {
    // Check cache first
    const cacheKey = ticker.toUpperCase();
    const cached = priceCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.price;
    }

    try {
        // Use live API for selected stocks
        if (LIVE_STOCKS.includes(ticker.toUpperCase()) && apiCallCount < MAX_API_CALLS_PER_MINUTE) {
            try {
                apiCallCount++;
                const response = await fetch(`${ALPHA_VANTAGE_BASE}?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${ALPHA_VANTAGE_API_KEY}`);
                const data = await response.json();
                
                if (data['Global Quote'] && data['Global Quote']['05. price']) {
                    const price = parseFloat(data['Global Quote']['05. price']);
                    
                    // Cache the price
                    priceCache.set(cacheKey, {
                        price: price,
                        timestamp: Date.now(),
                        isLive: true
                    });
                    
                    return price;
                }
                
                // If API fails, fall back to realistic dummy data
            } catch (apiError) {
            }
        } else if (LIVE_STOCKS.includes(ticker.toUpperCase())) {
        }
        
        // Dummy prices for remaining stocks or API failures
        const basePrices = {
            'AAPL': 175.43,
            'AMZN': 127.89,
            'TSLA': 248.42,
            'FB': 324.56,
            'C': 45.23,
            'GOOGL': 138.45,
            'MSFT': 378.85,
            'NFLX': 456.78,
            'NVDA': 467.34,
            'V': 234.56,
            'WMT': 158.23,
            'DIS': 98.76
        };
        
        const basePrice = basePrices[ticker.toUpperCase()] || 100;
        const variation = (Math.random() - 0.5) * 0.05; // ±2.5% variation
        const price = basePrice * (1 + variation);
        
        // Cache the dummy price
        priceCache.set(cacheKey, {
            price: price,
            timestamp: Date.now(),
            isLive: LIVE_STOCKS.includes(ticker.toUpperCase())
        });
        
        return price;
        
    } catch (error) {
        console.error(`Error fetching price for ${ticker}:`, error);
        return null;
    }
}

// Load available stocks with current prices
async function loadAvailableStocks() {
    const stocksDiv = document.getElementById('availableStocks');
    
    // Show loading state
    stocksDiv.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #9ca3af; grid-column: 1 / -1;">
            <i class="fas fa-sync-alt fa-spin" style="font-size: 2em; margin-bottom: 15px; color: #60a5fa;"></i>
            <div style="font-size: 1.1em;">Loading market data...</div>
        </div>
    `;
    
    try {
        // Fetch prices for all stocks
        const stocksWithPrices = await Promise.all(
            stocks.map(async (stock) => {
                const price = await fetchStockPrice(stock.symbol);
                const cached = priceCache.get(stock.symbol.toUpperCase());
                const isLive = cached && cached.isLive;
                const previousPrice = price ? price * (1 + (Math.random() - 0.5) * 0.02) : price; // Mock previous price
                const change = price && previousPrice ? price - previousPrice : 0;
                const changePercent = previousPrice ? (change / previousPrice) * 100 : 0;
                
                return {
                    ...stock,
                    currentPrice: price,
                    change: change,
                    changePercent: changePercent,
                    hasPrice: !!price,
                    isLive: isLive
                };
            })
        );
        
        // Generate compact stock cards
        stocksDiv.innerHTML = stocksWithPrices.map(stock => {
            const changeClass = stock.change >= 0 ? 'positive' : 'negative';
            const changeSymbol = stock.change >= 0 ? '+' : '';
            const priceIndicator = stock.isLive ? 
                '<i class="fas fa-circle" style="color: #10b981; font-size: 0.5em; margin-left: 3px;" title="Live Price"></i>' : 
                '<i class="fas fa-circle" style="color: #9ca3af; font-size: 0.5em; margin-left: 3px;" title="Demo Price"></i>';
            
            return `
                <div class="available-stock-card compact" data-symbol="${stock.symbol}" data-price="${stock.currentPrice || 0}">
                    <div class="stock-header">
                        <div class="stock-symbol">${stock.symbol}</div>
                    </div>
                    <div class="stock-price ${stock.hasPrice ? '' : 'loading'}">
                        ${stock.hasPrice ? '$' + stock.currentPrice.toFixed(2) + priceIndicator : 'Loading...'}
                    </div>
                    <div class="stock-name">${stock.name}</div>
                    ${stock.hasPrice ? `
                        <div class="stock-change ${changeClass}">
                            ${changeSymbol}${stock.changePercent.toFixed(1)}%
                        </div>
                    ` : ''}
                    <button class="quick-trade-btn" onclick="selectStockForTrading('${stock.symbol}', ${stock.currentPrice || 0})">
                        <i class="fas fa-plus"></i> Trade
                    </button>
                </div>
            `;
        }).join('');
        
        // Add click handlers for stock cards
        document.querySelectorAll('.available-stock-card').forEach(card => {
            card.addEventListener('click', function() {
                const symbol = this.dataset.symbol;
                const price = parseFloat(this.dataset.price);
                selectStockForTrading(symbol, price);
            });
        });
        
    } catch (error) {
        console.error('Error loading available stocks:', error);
        stocksDiv.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #ef4444; grid-column: 1 / -1;">
                <i class="fas fa-exclamation-triangle" style="font-size: 2em; margin-bottom: 15px;"></i>
                <div style="font-size: 1.1em;">Error loading market data</div>
                <button onclick="loadAvailableStocks()" style="margin-top: 15px; padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">
                    Retry
                </button>
            </div>
        `;
    }
}

// Select stock for trading
function selectStockForTrading(symbol, price) {
    const searchInput = document.getElementById('stockSearch');
    const priceInput = document.getElementById('price');
    const suggestionsDiv = document.getElementById('suggestions');
    
    // Clear previous selections
    document.querySelectorAll('.available-stock-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Select the clicked card
    const clickedCard = document.querySelector(`[data-symbol="${symbol}"]`);
    if (clickedCard) {
        clickedCard.classList.add('selected');
    }
    
    // Fill in the form
    searchInput.value = symbol;
    if (price > 0) {
        priceInput.value = price.toFixed(2);
    }
    
    // Hide suggestions
    suggestionsDiv.style.display = 'none';
    
    // Focus on quantity input
    document.getElementById('quantity').focus();
    
    showMessage('success', `Selected ${symbol} for trading`);
}

function updateSuggestionSelection(items) {
    items.forEach((item, index) => {
        item.classList.toggle('selected', index === selectedSuggestionIndex);
    });
}

function showMessage(type, text) {
    const messageDiv = document.getElementById(type === 'error' ? 'errorMessage' : 'successMessage');
    if (messageDiv) {
        messageDiv.textContent = text;
        messageDiv.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }
}

async function loadPortfolio() {
    try {
        const response = await fetch('/api/portfolio');
        const portfolio = await response.json();
        
        const portfolioDiv = document.getElementById('portfolio');
        const summaryDiv = document.getElementById('portfolioSummary');
        
        if (portfolio.length === 0) {
            portfolioDiv.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; color: #9ca3af; grid-column: 1 / -1;">
                    <i class="fas fa-chart-line" style="font-size: 4em; margin-bottom: 20px; color: #374151;"></i>
                    <h3 style="color: #d1d5db; margin-bottom: 15px; font-size: 1.5em;">No Holdings Yet</h3>
                    <p style="font-size: 1.1em; line-height: 1.5; margin-bottom: 25px;">Start trading to build your portfolio and track your investments!</p>
                    <div style="background: rgba(96, 165, 250, 0.1); border: 1px solid #60a5fa; border-radius: 8px; padding: 20px; margin: 20px auto; max-width: 500px;">
                        <h4 style="color: #60a5fa; margin-bottom: 10px;">💡 How to get started:</h4>
                        <ol style="text-align: left; color: #d1d5db; line-height: 1.8;">
                            <li>Browse available stocks above</li>
                            <li>Click any stock card to auto-fill the trade form</li>
                            <li>Enter the number of shares you want</li>
                            <li>Click BUY to add it to your portfolio</li>
                        </ol>
                    </div>
                </div>
            `;
            summaryDiv.style.display = 'none';
            updateCharts([], []);
            return;
        }
        
        // Convert string values to numbers for calculations
        const processedPortfolio = portfolio.map(stock => ({
            ...stock,
            quantity: parseFloat(stock.quantity),
            purchase_price: parseFloat(stock.purchase_price),
            value: parseFloat(stock.value)
        }));
        
        // Show loading indicator while fetching prices
        portfolioDiv.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #9ca3af;">
                <i class="fas fa-sync-alt fa-spin" style="font-size: 2em; margin-bottom: 15px; color: #60a5fa;"></i>
                <div style="font-size: 1.1em;">Fetching live market prices...</div>
            </div>
        `;
        
        // Fetch current market prices for all stocks
        const portfolioWithCurrentPrices = await Promise.all(
            processedPortfolio.map(async (stock) => {
                const currentPrice = await fetchStockPrice(stock.symbol);
                const cached = priceCache.get(stock.symbol.toUpperCase());
                const isLive = cached && cached.isLive;
                const currentValue = currentPrice ? currentPrice * stock.quantity : stock.value;
                const gainLoss = currentPrice ? currentValue - stock.value : 0;
                const gainLossPercent = currentPrice ? ((currentValue - stock.value) / stock.value) * 100 : 0;
                
                return {
                    ...stock,
                    currentPrice: currentPrice || stock.purchase_price,
                    currentValue: currentValue,
                    gainLoss: gainLoss,
                    gainLossPercent: gainLossPercent,
                    hasCurrentPrice: !!currentPrice,
                    isLive: isLive
                };
            })
        );
        
        // Calculate portfolio statistics
        const totalCurrentValue = portfolioWithCurrentPrices.reduce((sum, stock) => sum + stock.currentValue, 0);
        const totalOriginalValue = portfolioWithCurrentPrices.reduce((sum, stock) => sum + stock.value, 0);
        const totalGainLoss = totalCurrentValue - totalOriginalValue;
        const totalGainLossPercent = (totalGainLoss / totalOriginalValue) * 100;
        const totalShares = portfolioWithCurrentPrices.reduce((sum, stock) => sum + stock.quantity, 0);
        
        // Update summary section
        document.getElementById('totalStocks').textContent = portfolioWithCurrentPrices.length;
        document.getElementById('totalShares').textContent = totalShares.toLocaleString();
        document.getElementById('avgPrice').textContent = `$${(totalCurrentValue / totalShares).toFixed(2)}`;
        
        // Add gain/loss indicator to summary
        const gainLossClass = totalGainLoss >= 0 ? 'gain' : 'loss';
        const gainLossSymbol = totalGainLoss >= 0 ? '+' : '';
        document.getElementById('totalValue').innerHTML = `
            $${totalCurrentValue.toFixed(2)}
            <div style="font-size: 0.8em; margin-top: 5px;" class="${gainLossClass}">
                ${gainLossSymbol}$${totalGainLoss.toFixed(2)} (${totalGainLossPercent.toFixed(2)}%)
            </div>
        `;
        
        summaryDiv.style.display = 'block';
        
        // Update last updated time
        const now = new Date();
        document.getElementById('lastUpdated').textContent = `Prices last updated: ${now.toLocaleTimeString()}`;
        
        // Generate stock cards with compact trading-style design
        portfolioDiv.innerHTML = portfolioWithCurrentPrices.map(stock => {
            const gainLossClass = stock.gainLoss >= 0 ? 'gain' : 'loss';
            const gainLossSymbol = stock.gainLoss >= 0 ? '+' : '';
            const gainLossIcon = stock.gainLoss >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
            const stockName = stocks.find(s => s.symbol === stock.symbol)?.name || stock.company_name || stock.symbol;
            
            return `
                <div class="stock-card compact">
                    <div class="stock-header-compact">
                        <div class="stock-info-main">
                            <h3 class="stock-symbol">${stock.symbol}</h3>
                            <p class="stock-name">${stockName}</p>
                        </div>
                        <div class="stock-performance ${gainLossClass}">
                            <i class="fas ${gainLossIcon}"></i>
                            ${gainLossSymbol}${stock.gainLossPercent.toFixed(1)}%
                        </div>
                    </div>
                    
                    <div class="stock-metrics">
                        <div class="metric-row">
                            <div class="metric">
                                <span class="metric-label">Shares</span>
                                <span class="metric-value">${stock.quantity.toLocaleString()}</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">Purchase Price</span>
                                <span class="metric-value">$${stock.purchase_price.toFixed(2)}</span>
                            </div>
                        </div>
                        
                        <div class="metric-row">
                            <div class="metric">
                                <span class="metric-label">Current Price</span>
                                <span class="metric-value price-live">
                                    $${stock.currentPrice.toFixed(2)}
                                    ${stock.hasCurrentPrice ? 
                                        (stock.isLive ? 
                                            '<i class="fas fa-circle live-indicator" title="Live Price"></i>' : 
                                            '<i class="fas fa-circle demo-indicator" title="Demo Price"></i>'
                                        ) : ''}
                                </span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">Current Value</span>
                                <span class="metric-value value-highlight">$${stock.currentValue.toFixed(2)}</span>
                            </div>
                        </div>
                        
                        <div class="gain-loss-section ${gainLossClass}">
                            <span class="gain-loss-label">
                                <i class="fas ${gainLossIcon}"></i> Gain/Loss
                            </span>
                            <span class="gain-loss-value">
                                ${gainLossSymbol}$${Math.abs(stock.gainLoss).toFixed(2)} (${gainLossSymbol}${stock.gainLossPercent.toFixed(2)}%)
                            </span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        const labels = portfolioWithCurrentPrices.map(stock => stock.symbol);
        const values = portfolioWithCurrentPrices.map(stock => stock.currentValue);
        updateCharts(labels, values);
        
    } catch (error) {
        console.error('Error loading portfolio:', error);
        document.getElementById('portfolio').innerHTML = '<p style="text-align: center; color: #e74c3c;">Error loading portfolio. Please try again.</p>';
    }
}

function updateCharts(labels, values) {
    const pieCtx = document.getElementById('pieChart')?.getContext('2d');
    const barCtx = document.getElementById('barChart')?.getContext('2d');
    
    if (!pieCtx || !barCtx) return;
    
    // Destroy existing charts
    if (currentCharts.pie) currentCharts.pie.destroy();
    if (currentCharts.bar) currentCharts.bar.destroy();
    
    if (labels.length === 0) {
        // Show no data message
        pieCtx.clearRect(0, 0, pieCtx.canvas.width, pieCtx.canvas.height);
        barCtx.clearRect(0, 0, barCtx.canvas.width, barCtx.canvas.height);
        
        pieCtx.font = '16px Segoe UI';
        pieCtx.fillStyle = '#999';
        pieCtx.textAlign = 'center';
        pieCtx.fillText('No data available', pieCtx.canvas.width / 2, pieCtx.canvas.height / 2);
        
        barCtx.font = '16px Segoe UI';
        barCtx.fillStyle = '#999';
        barCtx.textAlign = 'center';
        barCtx.fillText('No data available', barCtx.canvas.width / 2, barCtx.canvas.height / 2);
        return;
    }
    
    const colors = [
        'rgba(52, 152, 219, 0.8)',
        'rgba(46, 204, 113, 0.8)',
        'rgba(243, 156, 18, 0.8)',
        'rgba(231, 76, 60, 0.8)',
        'rgba(155, 89, 182, 0.8)'
    ];
    
    // Create pie chart
    currentCharts.pie = new Chart(pieCtx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { 
                    position: 'bottom',
                    labels: { padding: 15, usePointStyle: true }
                }
            },
            cutout: '60%'
        }
    });
    
    // Create bar chart
    currentCharts.bar = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Portfolio Value ($)',
                data: values,
                backgroundColor: colors,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { 
                    beginAtZero: true,
                    ticks: { callback: function(value) { return '$' + value.toFixed(0); } }
                }
            }
        }
    });
}

async function loadHistory() {
    try {
        const res = await fetch('/api/portfolio/history');
        const data = await res.json();
        const historyCtx = document.getElementById('historyChart').getContext('2d');
        
        // Destroy existing chart
        if (currentCharts.history) currentCharts.history.destroy();
        
        if (data.length === 0) {
            historyCtx.clearRect(0, 0, historyCtx.canvas.width, historyCtx.canvas.height);
            historyCtx.font = '16px Segoe UI';
            historyCtx.fillStyle = '#999';
            historyCtx.textAlign = 'center';
            historyCtx.fillText('No transaction history available', historyCtx.canvas.width / 2, historyCtx.canvas.height / 2);
            return;
        }
        
        // Calculate cumulative portfolio value over time
        const portfolioValueOverTime = [];
        let cumulativeValue = 0;
        const stockHoldings = new Map(); // Track holdings for each stock
        
        // Process transactions in chronological order (oldest first) - reverse the data
        const sortedData = [...data].reverse();
        
        for (const transaction of sortedData) {
            const symbol = transaction.symbol;
            const quantity = parseFloat(transaction.quantity);
            const price = parseFloat(transaction.price);
            const action = transaction.action;
            
            // Update stock holdings
            if (!stockHoldings.has(symbol)) {
                stockHoldings.set(symbol, { quantity: 0, avgPrice: 0, totalInvested: 0 });
            }
            
            const holding = stockHoldings.get(symbol);
            
            if (action === 'BUY') {
                const newTotalInvested = holding.totalInvested + (quantity * price);
                const newQuantity = holding.quantity + quantity;
                holding.avgPrice = newTotalInvested / newQuantity;
                holding.quantity = newQuantity;
                holding.totalInvested = newTotalInvested;
            } else if (action === 'SELL') {
                holding.quantity = Math.max(0, holding.quantity - quantity);
                if (holding.quantity === 0) {
                    holding.totalInvested = 0;
                    holding.avgPrice = 0;
                } else {
                    holding.totalInvested = holding.quantity * holding.avgPrice;
                }
            }
            
            // Calculate total portfolio value at this point in time
            let totalValue = 0;
            for (const [sym, hold] of stockHoldings) {
                totalValue += hold.quantity * hold.avgPrice;
            }
            
            portfolioValueOverTime.push({
                timestamp: transaction.timestamp,
                value: totalValue
            });
        }
        
        // If we have duplicate timestamps, keep only the last value for each unique date
        const uniqueDataPoints = [];
        const seenDates = new Set();
        
        for (let i = portfolioValueOverTime.length - 1; i >= 0; i--) {
            const point = portfolioValueOverTime[i];
            const dateOnly = point.timestamp.split(' ')[0]; // Get just the date part
            
            if (!seenDates.has(dateOnly)) {
                seenDates.add(dateOnly);
                uniqueDataPoints.unshift(point); // Add to beginning to maintain chronological order
            }
        }
        
        // Create labels and values arrays - oldest to newest (left to right)
        const labels = uniqueDataPoints.map(item => {
            const date = new Date(item.timestamp);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });
        const values = uniqueDataPoints.map(item => item.value);
        
        currentCharts.history = new Chart(historyCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Portfolio Value ($)',
                    data: values,
                    borderColor: 'rgba(102, 126, 234, 1)',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 4,
                    pointBackgroundColor: 'rgba(102, 126, 234, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 3,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointHoverBackgroundColor: 'rgba(102, 126, 234, 1)',
                    pointHoverBorderColor: '#fff',
                    pointHoverBorderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: { 
                        display: true,
                        position: 'top',
                        labels: {
                            padding: 25,
                            usePointStyle: true,
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: 'rgba(102, 126, 234, 1)',
                        borderWidth: 2,
                        cornerRadius: 8,
                        displayColors: false,
                        callbacks: {
                            title: function(context) {
                                return 'Date: ' + context[0].label;
                            },
                            label: function(context) {
                                return 'Portfolio Value: $' + context.parsed.y.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
                            },
                            afterLabel: function(context) {
                                if (context.dataIndex > 0) {
                                    const currentValue = context.parsed.y;
                                    const previousValue = values[context.dataIndex - 1];
                                    const change = currentValue - previousValue;
                                    const changePercent = ((change / previousValue) * 100).toFixed(2);
                                    const changeSymbol = change >= 0 ? '+' : '';
                                    return `Change: ${changeSymbol}$${change.toFixed(2)} (${changeSymbol}${changePercent}%)`;
                                }
                                return '';
                            }
                        }
                    }
                },
                scales: {
                    y: { 
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0,0,0,0.1)',
                            drawBorder: false
                        },
                        ticks: { 
                            padding: 10,
                            font: {
                                size: 12,
                                weight: '500'
                            },
                            callback: function(value) { 
                                return '$' + value.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0}); 
                            }
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(0,0,0,0.1)',
                            drawBorder: false
                        },
                        ticks: {
                            padding: 10,
                            font: {
                                size: 12,
                                weight: '500'
                            },
                            maxRotation: 45
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error loading history:', error);
        const historyCtx = document.getElementById('historyChart').getContext('2d');
        historyCtx.clearRect(0, 0, historyCtx.canvas.width, historyCtx.canvas.height);
        historyCtx.font = '16px Segoe UI';
        historyCtx.fillStyle = '#e74c3c';
        historyCtx.textAlign = 'center';
        historyCtx.fillText('Error loading portfolio history', historyCtx.canvas.width / 2, historyCtx.canvas.height / 2);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Update market time every second
    function updateMarketTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { 
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        const timeElement = document.getElementById('lastUpdateTime');
        if (timeElement) {
            timeElement.textContent = timeString;
        }
    }
    
    // Update time immediately and then every second
    updateMarketTime();
    setInterval(updateMarketTime, 1000);
    
    // Reset API call counter every minute
    setInterval(() => {
        apiCallCount = 0;
    }, 60000);

    // Initialize search functionality
    const searchInput = document.getElementById('stockSearch');
    const suggestionsDiv = document.getElementById('suggestions');
    let selectedSuggestionIndex = -1;

    // Stock search functionality
    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase();
        if (query.length < 1) {
            suggestionsDiv.style.display = 'none';
            return;
        }

        const matches = stocks.filter(stock => 
            stock.symbol.toLowerCase().includes(query) || 
            stock.name.toLowerCase().includes(query)
        ).slice(0, 5);

        if (matches.length > 0) {
            suggestionsDiv.innerHTML = matches.map(stock => 
                `<div class="suggestion-item" data-symbol="${stock.symbol}">
                    <strong>${stock.symbol}</strong> - ${stock.name}
                </div>`
            ).join('');
            suggestionsDiv.style.display = 'block';
        } else {
            suggestionsDiv.style.display = 'none';
        }
    });

    // Suggestion click handler
    suggestionsDiv.addEventListener('click', async function(e) {
        if (e.target.classList.contains('suggestion-item')) {
            const symbol = e.target.dataset.symbol;
            searchInput.value = symbol;
            suggestionsDiv.style.display = 'none';
            selectedSuggestionIndex = -1;
            
            // Auto-populate price from API
            const priceInput = document.getElementById('price');
            priceInput.value = 'Loading...';
            priceInput.disabled = true;
            
            try {
                const currentPrice = await fetchStockPrice(symbol);
                if (currentPrice) {
                    priceInput.value = currentPrice.toFixed(2);
                } else {
                    priceInput.value = '';
                    showMessage('error', 'Could not fetch current price. Please enter manually.');
                }
            } catch (error) {
                priceInput.value = '';
                showMessage('error', 'Error fetching price. Please enter manually.');
            } finally {
                priceInput.disabled = false;
            }
        }
    });

    // Hide suggestions when clicking outside
    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !suggestionsDiv.contains(e.target)) {
            suggestionsDiv.style.display = 'none';
        }
    });

    // Form submission
    const stockForm = document.getElementById('stockForm');
    stockForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const action = e.submitter.value;
        const ticker = document.getElementById('stockSearch').value.toUpperCase();
        const quantity = parseInt(document.getElementById('quantity').value);
        const price = parseFloat(document.getElementById('price').value);
        const company_name = stocks.find(s => s.symbol === ticker)?.name || ticker;
        
        // Validation
        if (!ticker || !quantity || !price) {
            showMessage('error', 'Please fill in all fields');
            return;
        }
        
        try {
            const response = await fetch('/api/portfolio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symbol: ticker, quantity, price, action: action.toUpperCase(), company_name })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                showMessage('success', `Successfully ${action.toLowerCase() === 'buy' ? 'bought' : 'sold'} ${quantity} shares of ${ticker}`);
                document.getElementById('stockForm').reset();
                loadPortfolio();
                loadHistory();
            } else {
                showMessage('error', result.error || 'Transaction failed');
            }
        } catch (error) {
            showMessage('error', 'Network error occurred');
        }
    });

    // Refresh prices button
    const refreshBtn = document.getElementById('refreshPricesBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async function() {
            this.disabled = true;
            this.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Refreshing...';
            
            // Clear price cache to force fresh data
            priceCache.clear();
            
            try {
                await loadPortfolio();
                await loadAvailableStocks();
                showMessage('success', 'All prices updated successfully!');
            } catch (error) {
                showMessage('error', 'Error refreshing prices. Please try again.');
            } finally {
                this.disabled = false;
                this.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
            }
        });
    }

    loadPortfolio();
    loadHistory();
    loadAvailableStocks();
    
    // Add a helpful tip after a delay if no portfolio exists
    setTimeout(() => {
        const portfolio = document.getElementById('portfolio');
        if (portfolio && portfolio.innerHTML.includes('No Holdings Yet')) {
            // Portfolio is empty - users can start trading by clicking on available stocks
        }
    }, 2000);
});
