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
const FINANCIAL_API_BASE = 'https://c4rm9elh30.execute-api.us-east-1.amazonaws.com/default/cachedPriceData';

// Cache for stock prices to avoid excessive API calls
const priceCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Function to fetch real-time stock price
async function fetchStockPrice(ticker) {
    // Check cache first
    const cacheKey = ticker.toUpperCase();
    const cached = priceCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.price;
    }

    try {
        const response = await fetch(`${FINANCIAL_API_BASE}?ticker=${ticker}`);
        if (!response.ok) {
            throw new Error('Failed to fetch price data');
        }
        
        const data = await response.json();
        if (data.price_data && data.price_data.close && data.price_data.close.length > 0) {
            // Get the latest closing price
            const latestPrice = data.price_data.close[data.price_data.close.length - 1];
            
            // Cache the price
            priceCache.set(cacheKey, {
                price: latestPrice,
                timestamp: Date.now()
            });
            
            return latestPrice;
        }
        
        throw new Error('No price data available');
    } catch (error) {
        console.error(`Error fetching price for ${ticker}:`, error);
        return null;
    }
}

function updateSuggestionSelection(items) {
    items.forEach((item, index) => {
        item.classList.toggle('selected', index === selectedSuggestionIndex);
    });
}

function showMessage(type, text) {
    const messageDiv = document.getElementById(type + 'Message');
    messageDiv.textContent = text;
    messageDiv.style.display = 'block';
    
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

async function loadPortfolio() {
    try {
        const response = await fetch('/api/portfolio');
        const portfolio = await response.json();
        
        const portfolioDiv = document.getElementById('portfolio');
        const summaryDiv = document.getElementById('portfolioSummary');
        
        if (portfolio.length === 0) {
            portfolioDiv.innerHTML = '<p style="text-align: center; color: #666; font-style: italic; padding: 40px;">No stocks in portfolio. Start trading to see your investments here!</p>';
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
        portfolioDiv.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;"><div style="font-size: 1.2em;">🔄 Fetching live prices...</div></div>';
        
        // Fetch current market prices for all stocks
        const portfolioWithCurrentPrices = await Promise.all(
            processedPortfolio.map(async (stock) => {
                const currentPrice = await fetchStockPrice(stock.symbol);
                const currentValue = currentPrice ? currentPrice * stock.quantity : stock.value;
                const gainLoss = currentPrice ? currentValue - stock.value : 0;
                const gainLossPercent = currentPrice ? ((currentValue - stock.value) / stock.value) * 100 : 0;
                
                return {
                    ...stock,
                    currentPrice: currentPrice || stock.purchase_price,
                    currentValue: currentValue,
                    gainLoss: gainLoss,
                    gainLossPercent: gainLossPercent,
                    hasCurrentPrice: !!currentPrice
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
        
        // Generate stock cards with essential data
        portfolioDiv.innerHTML = portfolioWithCurrentPrices.map(stock => {
            const gainLossClass = stock.gainLoss >= 0 ? 'gain' : 'loss';
            const gainLossSymbol = stock.gainLoss >= 0 ? '+' : '';
            
            return `
                <div class="stock-card">
                    <div class="stock-ticker">
                        <span>${stock.symbol}</span>
                        <div class="stock-icon">${stock.symbol.substring(0, 2)}</div>
                    </div>
                    <div class="stock-info">
                        <span>Shares:</span>
                        <span>${stock.quantity.toLocaleString()}</span>
                    </div>
                    <div class="stock-info">
                        <span>Purchase Price:</span>
                        <span>$${stock.purchase_price.toFixed(2)}</span>
                    </div>
                    <div class="stock-info">
                        <span>Current Price:</span>
                        <span ${stock.hasCurrentPrice ? 'style="color: #2ecc71; font-weight: bold;"' : ''}>
                            $${stock.currentPrice.toFixed(2)}
                            ${stock.hasCurrentPrice ? ' 🔴' : ''}
                        </span>
                    </div>
                    <div class="stock-info">
                        <span class="stock-value">Current Value:</span>
                        <span class="stock-value">$${stock.currentValue.toFixed(2)}</span>
                    </div>
                    <div class="stock-info ${gainLossClass}">
                        <span>Gain/Loss:</span>
                        <span>${gainLossSymbol}$${stock.gainLoss.toFixed(2)} (${gainLossSymbol}${stock.gainLossPercent.toFixed(2)}%)</span>
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
        
        const labels = data.map(item => item.timestamp);
        const values = data.map(item => item.net);
        
        currentCharts.history = new Chart(historyCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Net Transaction Value',
                    data: values,
                    borderColor: 'rgba(155, 89, 182, 1)',
                    backgroundColor: 'rgba(155, 89, 182, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' }
                },
                scales: {
                    y: { 
                        beginAtZero: true,
                        ticks: { callback: function(value) { return '$' + value.toFixed(0); } }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error loading history:', error);
    }
}

document.addEventListener('DOMContentLoaded', function() {
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
            this.innerHTML = '🔄 Refreshing...';
            
            // Clear price cache to force fresh data
            priceCache.clear();
            
            try {
                await loadPortfolio();
                showMessage('success', 'Portfolio prices updated successfully!');
            } catch (error) {
                showMessage('error', 'Error refreshing prices. Please try again.');
            } finally {
                this.disabled = false;
                this.innerHTML = '🔄 Refresh Prices';
            }
        });
    }

    loadPortfolio();
    loadHistory();
});
