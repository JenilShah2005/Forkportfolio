import YahooFinance  from "yahoo-finance2";
import { getData } from "../../utils/getData.js";
import { stockPriceStore } from "../../utils/stockPriceStore.js";
const yahooFinance = new YahooFinance();
const stockmapping = (stockData) => {
    return {
        symbol: stockData.symbol,
        shortName: stockData.shortName,
        longName: stockData.longName,
        exchange: stockData.exchange,
        currency: stockData.currency,
        price: stockData.regularMarketPrice?.toFixed(2) ?? null,
        change: stockData.regularMarketChange?.toFixed(2) ?? null,
        changePercent: stockData.regularMarketChangePercent?.toFixed(2) ?? 'N/A',
    }
};

const getSymbols = async(type,count) => {
    try {
        let queryOptions = { lang: 'en-IN', region: 'IN', count: count || 2 };
        const result = await yahooFinance.screener(type, queryOptions);
        if (!result || !result.quotes) {
            return null;
        }
        const mappedResults = result.quotes.map(stockmapping);
        return mappedResults;
    } catch (error) {
        if (error && error.name === "FailedYahooValidationError") {
        if (error.result) {
          return error.result.quotes.map(stockmapping);
        }
        if (error.errors && error.errors[0] && error.errors[0].data) {
            return error.errors[0].data.quotes.map(stockmapping);
        }
        return null;
    }
};
};
export const getMarketGainers = async (req, res) => {
    try {
        const result = stockPriceStore.get("day_gainers");
        if(result){
            return res.status(200).json({ success: true, data: result.gainers });
        }
        const gainers = await getSymbols('day_gainers',5);
        if (!gainers) {
            return res.status(504).json({ success: false, message: "No gainers found." });
        }
        stockPriceStore.add("day_gainers",{gainers: gainers,expiresAt: Date.now()+60*1000});
        return res.status(200).json({ success: true, data: gainers });
    } catch (error) {
        console.error('Market gainers error:', error);
        return res.status(500).json({ success: false, message: "An error occurred while fetching market gainers." });
    }  
};

export const getMarketLosers = async (req, res) => {
    try {
        const result = stockPriceStore.get("day_losers");
        if(result){
            return res.status(200).json({ success: true, data: result.losers });
        }
        const losers = await getSymbols('day_losers',5);
        if (!losers) {
            return res.status(504).json({ success: false, message: "No losers found." });
        }
        stockPriceStore.add("day_losers",{losers:losers,expiresAt: Date.now()+60*1000});
        return res.status(200).json({ success: true, data: losers });
    } catch (error) {
        console.error('Market losers error: ', error);
        return res.status(500).json({ success: false, message: "An error occurred while fetching market losers." });
    }
};
export const getMarketactiveStocks = async (req, res) => {
    try {
        const result = stockPriceStore.get("most_actives");
        if(result){
            return res.status(200).json({ success: true, data: result.activeStocks,news: result.news });
        }
        const activeStocks = await getSymbols('most_actives',7);
        if (!activeStocks) {
            return res.status(504).json({ success: false, message: "No active stocks found." });
        }
        let symbols = activeStocks.map(stock => stock.symbol);
        const newsResults = await getData(symbols);
        if(!newsResults){
            return res.status(401).json({ success: true, data: activeStocks,news:[] });
        }
        const news = newsResults.news;
        stockPriceStore.add("most_actives",{activeStocks:activeStocks,news:news,expiresAt: Date.now()+60*1000});
        return res.status(200).json({ success: true, data: activeStocks,news:news });
    } catch (error) {
        console.error('Market active stocks error: ', error);
        return res.status(500).json({ success: false, message: "An error occurred while fetching market active stocks." });
    }
};