let currentCharts = { pie: null, bar: null, history: null };

const stocks = [
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.' },
    { symbol: 'MSFT', name: 'Microsoft Corporation' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.' },
    { symbol: 'TSLA', name: 'Tesla Inc.' },
    { symbol: 'META', name: 'Meta Platforms Inc.' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation' },
    { symbol: 'JPM', name: 'JPMorgan Chase & Co.' },
    { symbol: 'JNJ', name: 'Johnson & Johnson' },
    { symbol: 'V', name: 'Visa Inc.' },
    { symbol: 'PG', name: 'Procter & Gamble Co.' },
    { symbol: 'UNH', name: 'UnitedHealth Group Inc.' },
    { symbol: 'MA', name: 'Mastercard Inc.' },
    { symbol: 'HD', name: 'Home Depot Inc.' },
    { symbol: 'BAC', name: 'Bank of America Corp.' },
    { symbol: 'ABBV', name: 'AbbVie Inc.' },
    { symbol: 'PFE', name: 'Pfizer Inc.' },
    { symbol: 'KO', name: 'Coca-Cola Co.' },
    { symbol: 'AVGO', name: 'Broadcom Inc.' },
    { symbol: 'PEP', name: 'PepsiCo Inc.' }
];

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
    console.log('Loading portfolio...'); // Debug log
    try {
        const response = await fetch('/api/portfolio');
        console.log('Portfolio response status:', response.status); // Debug log
        const portfolio = await response.json();
        console.log('Portfolio data:', portfolio); // Debug log
        
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
        
        console.log('Processed portfolio:', processedPortfolio);
        
        // Calculate portfolio statistics
        const totalValue = processedPortfolio.reduce((sum, stock) => sum + stock.value, 0);
        const totalShares = processedPortfolio.reduce((sum, stock) => sum + stock.quantity, 0);
        const avgPrice = totalValue / totalShares;
        
        // Update summary section
        document.getElementById('totalValue').textContent = `$${totalValue.toFixed(2)}`;
        document.getElementById('totalStocks').textContent = processedPortfolio.length;
        document.getElementById('totalShares').textContent = totalShares.toLocaleString();
        document.getElementById('avgPrice').textContent = `$${avgPrice.toFixed(2)}`;
        summaryDiv.style.display = 'block';
        
        // Generate enhanced stock cards
        portfolioDiv.innerHTML = processedPortfolio.map(stock => `
            <div class="stock-card">
                <div class="stock-ticker">
                    <span>${stock.symbol}</span>
                    <div class="stock-icon">${stock.symbol.substring(0, 2)}</div>
                </div>
                <div class="stock-info">
                    <span>Shares Owned:</span>
                    <span>${stock.quantity.toLocaleString()}</span>
                </div>
                <div class="stock-info">
                    <span>Current Price:</span>
                    <span>$${stock.purchase_price.toFixed(2)}</span>
                </div>
                <div class="stock-info">
                    <span>Portfolio %:</span>
                    <span>${((stock.value / totalValue) * 100).toFixed(1)}%</span>
                </div>
                <div class="stock-info">
                    <span class="stock-value">Total Value:</span>
                    <span class="stock-value">$${stock.value.toFixed(2)}</span>
                </div>
            </div>
        `).join('');
        
        const labels = processedPortfolio.map(stock => stock.symbol);
        const values = processedPortfolio.map(stock => stock.value);
        updateCharts(labels, values);
        
    } catch (error) {
        console.error('Error loading portfolio:', error);
        document.getElementById('portfolio').innerHTML = '<p style="text-align: center; color: #e74c3c;">Error loading portfolio. Please try again.</p>';
    }
}

function updateCharts(labels, values) {
    console.log('Updating charts with:', { labels, values }); // Debug log
    console.log('Chart.js available:', typeof Chart); // Debug log
    
    const pieCtx = document.getElementById('pieChart')?.getContext('2d');
    const barCtx = document.getElementById('barChart')?.getContext('2d');
    
    console.log('Chart contexts found:', { pieCtx: !!pieCtx, barCtx: !!barCtx }); // Debug log
    
    if (!pieCtx || !barCtx) {
        console.error('Chart canvases not found!');
        return;
    }
    
    // Destroy existing charts
    if (currentCharts.pie) {
        console.log('Destroying existing pie chart');
        currentCharts.pie.destroy();
    }
    if (currentCharts.bar) {
        console.log('Destroying existing bar chart');
        currentCharts.bar.destroy();
    }
    
    if (labels.length === 0) {
        // Clear canvas and show no data message
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
    
    // Enhanced color palette
    const colors = [
        'rgba(52, 152, 219, 0.8)',  // Blue
        'rgba(46, 204, 113, 0.8)',  // Green
        'rgba(243, 156, 18, 0.8)',  // Orange
        'rgba(231, 76, 60, 0.8)',   // Red
        'rgba(155, 89, 182, 0.8)',  // Purple
        'rgba(26, 188, 156, 0.8)',  // Turquoise
        'rgba(241, 196, 15, 0.8)',  // Yellow
        'rgba(230, 126, 34, 0.8)',  // Dark Orange
    ];
    
    const borderColors = colors.map(color => color.replace('0.8', '1'));
    
    // Create enhanced pie chart
    currentCharts.pie = new Chart(pieCtx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors,
                borderColor: borderColors,
                borderWidth: 2,
                hoverBorderWidth: 3,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { 
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        font: {
                            size: 12,
                            family: 'Segoe UI'
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const percentage = ((context.parsed / values.reduce((a, b) => a + b, 0)) * 100).toFixed(1);
                            return `${context.label}: $${context.parsed.toFixed(2)} (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '60%'
        }
    });
    
    // Create enhanced bar chart
    currentCharts.bar = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Portfolio Value ($)',
                data: values,
                backgroundColor: colors,
                borderColor: borderColors,
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { 
                    display: false 
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: $${context.parsed.y.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                y: { 
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0,0,0,0.1)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toFixed(0);
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

async function loadHistory() {
    console.log('Loading history...'); // Debug log
    try {
        const res = await fetch('/api/portfolio/history');
        console.log('History response status:', res.status); // Debug log
        
        const data = await res.json();
        console.log('History data:', data); // Debug log
        
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
                    borderWidth: 3,
                    pointBackgroundColor: 'rgba(155, 89, 182, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { 
                        position: 'top',
                        labels: {
                            font: {
                                size: 12,
                                family: 'Segoe UI'
                            }
                        }
                    },
                    title: { 
                        display: true, 
                        text: 'Transaction History Over Time',
                        font: {
                            size: 16,
                            family: 'Segoe UI',
                            weight: 'bold'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Net Value: $${context.parsed.y.toFixed(2)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: { 
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        },
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toFixed(0);
                            }
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error loading history:', error);
    }
}

// Load portfolio on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing...'); // Debug log
    
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
        ).slice(0, 8);

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
    suggestionsDiv.addEventListener('click', function(e) {
        if (e.target.classList.contains('suggestion-item')) {
            const symbol = e.target.dataset.symbol;
            searchInput.value = symbol;
            suggestionsDiv.style.display = 'none';
            selectedSuggestionIndex = -1;
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
    console.log('Form element found:', stockForm); // Debug log
    
    stockForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('Form submitted!'); // Debug log
        
        const formData = new FormData(e.target);
        const action = e.submitter.value;
        
        const ticker = document.getElementById('stockSearch').value.toUpperCase();
        const quantity = parseInt(document.getElementById('quantity').value);
        const price = parseFloat(document.getElementById('price').value);
        const company_name = stocks.find(s => s.symbol === ticker)?.name || ticker;
        
        console.log('Form submission:', { ticker, quantity, price, action, company_name });
        
        // Validation
        if (!ticker || !quantity || !price) {
            showMessage('error', 'Please fill in all fields');
            return;
        }
        
        try {
            const response = await fetch('/api/portfolio', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symbol: ticker, quantity, price, action: action.toUpperCase(), company_name })
            });
            
            const result = await response.json();
            console.log('Server response:', result);
            
            if (response.ok) {
                showMessage('success', `Successfully ${action.toLowerCase() === 'buy' ? 'bought' : 'sold'} ${quantity} shares of ${ticker}`);
                document.getElementById('stockForm').reset();
                loadPortfolio();
                loadHistory();
            } else {
                showMessage('error', result.error || 'Transaction failed');
            }
        } catch (error) {
            console.error('Network error:', error);
            showMessage('error', 'Network error occurred');
        }
    });

    loadPortfolio();
    loadHistory();
});
