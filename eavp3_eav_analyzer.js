var stats ={};
function round(number, digits) {
	return Math.round(parseFloat(number*Math.pow(10, digits)))/Math.pow(10, digits);
}

function getStats(stats) {
	stats.price = round(stats.price, 3);
	stats.dividend = round(stats.dividend, 2);
	stats.yield = stats.dividend*100 / stats.price;
	stats.yield = round(stats.yield, 2);
	stats.current_breakeven = round(stats.price*1.05/0.95, 3);
	stats.current_breakeven_days = round(stats.current_breakeven/stats.dividend, 0);
	
	if(stats.shares_owned != "0")
		stats = purchaseStats(stats);
	else
		stats.shares_owned = 0;
	
	return stats;
}

function purchaseStats(stats) {
	// Get ownership info
	stats.ownership_value = parseFloat(stats.purchase_info_text.match(/[\d\.\,]+/)[0].replace(/,/, ""));
	stats.ownership_gain = stats.purchase_info_text.match(/[\d\.\,]+\s+\(([\-\+][\d\.\,]+)/)[1].replace(/,/, "");
	stats.gain_flg = (stats.ownership_gain.match(/^./)[0] == "-" ? false : true);
	stats.ownership_gain = (stats.gain_flg ? parseFloat(stats.ownership_gain) : (-1)*stats.ownership_gain);
	
	// Calculate purchase amount, original commissions paid, purchase price, and breakeven to overcome the 5% commission
	stats.purchase_amount = round(stats.shares_owned * stats.price - stats.ownership_gain, 3);
	stats.commissions_paid = round(stats.purchase_amount * 0.05, 3);
	stats.purchase_price = round(stats.purchase_amount / stats.shares_owned, 3);
	stats.breakeven = round((stats.purchase_amount + stats.commissions_paid) / 0.95 / stats.shares_owned, 3);
	stats.real_gain = round(stats.price*.95*stats.shares_owned - stats.purchase_amount - stats.commissions_paid, 3);
	stats.real_gain_per_share = round(stats.real_gain / stats.shares_owned, 3);
	stats.cap_appreciation = round(100*stats.real_gain / stats.purchase_amount, 2);
	
	return stats;
}

function outputStats(stats) {
	if($(".influencer-stats ul li:contains('Current Break Even')").length == 0) {
		// Add the current breakeven to the stats
		$(".influencer-stats ul li:contains('Shares Owned By You')").before('<label title="The price the stock needs to reach, in order to cover a purchase and sale commission of 5%"><li><strong>Current Break Even</strong><span class="float-right">'+(stats.current_breakeven)+'</span></li></label>');
		// Add the dividend yield to the stats
		$(".influencer-stats ul li:contains('Shares Owned By You')").before('<label title="Average Daily Dividend per Share / Current Share price"><li><strong>Daily Dividend Yield</strong><span class="float-right">'+(stats.yield)+'%</span></li></label>');
		// Add the days to breakeven to the stats
		$(".influencer-stats ul li:contains('Shares Owned By You')").before('<label title="How many days it will take to accumulate enough dividends to reach the breakeven.  This calculation is based on the average daily dividend per share."><li><strong>Days to Pay Back</strong><span class="float-right">'+(stats.current_breakeven_days)+'</span></li></label>');
	
		// If we own shares, obtain dividend history and display profit/loss stats
		if(stats.shares_owned > 0) {
			// Add a loading icon
			if($(".influencer-stats ul li img[src='http://www.empireavenue.com/public/images/skylark/loader.gif']").length == 0) {
				$(".influencer-stats ul li:contains('Shares Owned By You')").after('<label title="Loding dividend history..."><li><img src="http://www.empireavenue.com/public/images/skylark/loader.gif" align="middle"></li></label>');
			}
			// Get the ticker
			if($(".pf-info-title a:eq(1)").length == 1)
				ticker = $(".pf-info-title a:eq(1)").text();
			else
				ticker = $("#nameplate-ticker").text().trim();
			
			// Send the request to obtain the dividends
			port.postMessage({
				action: "getDividends", 
				ticker: ticker
			});
			
			// Parse the dividend request response
			port.onMessage.addListener(function(msg) {
				// Set dividends to 0
				stats.dividends = 0;
				
				// If we got back the dividend history, total the dividends
				try {
					if(msg.json.data.length > 0) {
						for(x in msg.json.data) {
							stats.dividends += parseFloat(msg.json.data[x].dividend);
						}
					}
				}
				catch(e) {
					// Don't do anything
				}
				
				// Calculate everything
				stats.total_return = round(stats.real_gain + stats.dividends, 3);
				stats.roi = round(100*stats.total_return / stats.purchase_amount, 2);
				if(stats.dividends > 0) {
					stats.dividend_days = msg.json.data.length;
					stats.average_dividends = stats.dividends / msg.json.data.length;
					stats.average_dividends_per_share = round(stats.dividends / msg.json.data.length / stats.shares_owned, 3);
					stats.effective_dividend_payback = round(stats.breakeven / stats.average_dividends_per_share, 0);
					stats.effective_dividend_yield = round(100*stats.average_dividends / stats.purchase_price / stats.shares_owned, 2);
					stats.average_dividends = round(stats.average_dividends, 3);
				}
				else {
					stats.average_dividends = 0;
					stats.effective_dividend_payback = 0;
					stats.average_dividends_per_share = 0;
					stats.effective_dividend_yield = 0;
				}
				stats.dividends = round(stats.dividends, 3);
				
				// Output the dividend stats
				if($(".influencer-stats ul li:contains('Total ROI with Dividends')").length == 0) {
					$(".influencer-stats ul li img[src='http://www.empireavenue.com/public/images/skylark/loader.gif']").parent().parent().remove();
					$(".influencer-stats ul li:contains('Shares Owned By You')").after('<label title="This is the percentage gain you have earned, accounting for purchase and sale commissions and dividends you\'ve accumulated, based on your average purchase price."><li><strong>Total ROI with Dividends:</strong><span class="float-right">'+stats.roi+'%</span></li></title>');
					$(".influencer-stats ul li:contains('Shares Owned By You')").after('<label title="This is how much you\'ve earned in total including dividends and the stock increase/decrease, accounting for the commissions you paid on purchase and commissions you would pay were you to sell at the current price."><li><strong>Total Return with Dividends:</strong><span class="float-right">'+(stats.total_return > 0 ? "+" : "")+stats.total_return+'</span></li></title>');
					$(".influencer-stats ul li:contains('Shares Owned By You')").after('<label title="How many days it will take to accumulate enough dividends to reach your breakeven, based on your average daily dividends."><li><strong>Days to Pay Back</strong><span class="float-right">'+(stats.effective_dividend_payback)+'</span></li></label>');
					$(".influencer-stats ul li:contains('Shares Owned By You')").after('<label title="Your average daily dividend per share divided by your average purchase price."><li><strong>Your Daily Dividend Yield:</strong><span class="float-right">'+stats.effective_dividend_yield+'%</span></li></label>');
					$(".influencer-stats ul li:contains('Shares Owned By You')").after('<label title="The average daily dividend you\'ve received per share."><li><strong>Your Avg Daily Dividend per Share:</strong><span class="float-right">'+stats.average_dividends_per_share+'</span></li></label>');
					$(".influencer-stats ul li:contains('Shares Owned By You')").after('<label title="The average daily dividend you\'ve received from the stock."><li><strong>Your Avg Daily Dividend:</strong><span class="float-right">'+stats.average_dividends+'</span></li></label>');
					$(".influencer-stats ul li:contains('Shares Owned By You')").after('<li><strong>Your Accumulated Dividends in '+stats.dividend_days+' days:</strong><span class="float-right">'+stats.dividends+'</span></li>');
					if(stats.total_return > 0) {
						$(".influencer-stats ul li:contains('Total R') span").addClass("ticker-up").css("font-weight", "bold");
					}
					else if(stats.total_return < 0) {
						$(".influencer-stats ul li:contains('Total R') span").addClass("ticker-down").css("font-weight", "bold");
					}
					
					// Display the profitability stats
					$(".influencer-stats ul li:contains('Shares Owned By You')").after('<label title="This is the percentage gain/loss, accounting for purchase and sale commissions, based on your average purchase price."><li><strong>Total % Gain after Commissions:</strong><span class="float-right">'+stats.cap_appreciation+'%</span></li></label>');
					$(".influencer-stats ul li:contains('Shares Owned By You')").after('<label title="This is how much you\'ve gained/lost in total, including your purchase commissions and the sale commissions you would pay if you sold at the current price."><li><strong>Total Gain after Commissions:</strong><span class="float-right">'+(stats.real_gain_per_share > 0 ? "+" : "")+stats.real_gain+'</span></li></label>');
					$(".influencer-stats ul li:contains('Shares Owned By You')").after('<label title="This is how much you\'ve gained/lost per share, accounting for your purchase commissions and the sale commissions you would pay if you sold at the current price."><li><strong>Gain per Share after Commissions:</strong><span class="float-right">'+(stats.real_gain_per_share > 0 ? "+" : "")+stats.real_gain_per_share+'</span></li></label>');
					$(".influencer-stats ul li:contains('Shares Owned By You')").after('<label title="The stock must be at or above this price for you to recover your purchase commissions and the sale commissions at your break even price."><li><strong>Your Breakeven Price:</strong><span class="float-right">'+stats.breakeven+'</span></li></label>');
					$(".influencer-stats ul li:contains('Shares Owned By You')").after('<li><strong>Your Average Purchase Price:</strong><span class="float-right">'+(stats.purchase_price)+'</span></li>');
					if(stats.real_gain > 0) {
						$(".influencer-stats ul li:contains('Total Gain') span").addClass("ticker-up").css("font-weight", "bold");
						$(".influencer-stats ul li:contains('Total % Gain') span").addClass("ticker-up").css("font-weight", "bold");
						$(".influencer-stats ul li:contains('Gain/Share') span").addClass("ticker-up").css("font-weight", "bold");
					}
					else if(stats.real_gain < 0) {
						$(".influencer-stats ul li:contains('Total % Gain') span").addClass("ticker-down").css("font-weight", "bold");
						$(".influencer-stats ul li:contains('Total Gain') span").addClass("ticker-down").css("font-weight", "bold");
						$(".influencer-stats ul li:contains('Gain per Share') span").addClass("ticker-down").css("font-weight", "bold");
					}
				}
			});
		}
	}
}

 // Mutation event to handle the loading of stocks on a portfolio/list page
$(document).bind('DOMNodeInserted', function (e) {
	// Check to see if the influencer-stats class was added and make sure we haven't already added the daily dividend yield
	if(
		$(".influencer-stats ul li:contains('Daily Dividend Yield')").length == 0
		&& $(".influencer-stats ul li:contains('Shares They Own In You') span").length == 1
	) {
		// Get the stats
		stats.price = $(".influencer-stats ul li:contains('Share Price') span").text().match(/^\s+(\d+\.\d+)\s/)[1];
		stats.dividend = $(".influencer-stats ul li:contains('Daily Dividend/Share') span").text();
		stats.shares_owned = $(".influencer-stats ul li:contains('Shares Owned By You') span").first().text().match(/(\d+)\s?/)[1];
		if(stats.shares_owned != "0") {
			// Get the purchase info
			stats.purchase_info_text = $(".influencer-stats ul li:contains('Value in your Portfolio') span span").text();
		}
		stats = getStats(stats);
		outputStats(stats);
	}
});

// Update the profile page with profitability stats
if(
	$("#option-bar ul li:eq(0)").attr("class") == "current"
	&& $("#nmp-stats div:eq(0) span span:eq(3)").length == 1
	&& $(".influencer-stats").length == 0
) {
	// First remove our mutation event so we don't mess things up
	$(document).unbind('DOMNodeInserted');
	
	stats.price = $("#nameplate-last-trade").text().replace(/\s|,/g, "");
	stats.dividend = $("#nmp-stats div:eq(0) span span:eq(3)").text();
	if($("#nmp-stats div:eq(2) span:eq(5)").length == 1) {
		stats.shares_owned = $("#nmp-stats div:eq(2) span:eq(3)").text();
		stats.purchase_info_text = $("#nmp-stats div:eq(2) span:eq(5)").text();
	}
	else {
		stats.shares_owned = "0";
	}
	stats = getStats(stats);	
	$("#profile-achieve").before('<div style="width: 400px; margin: 0 auto" class="influencer-stats"><h3>Current Investment Analysis</h3></div><div class="clear"></div>');
	$(".influencer-stats h3").after('<ul><li><strong>Shares Owned By You:</strong><span class="float-right">'+stats.shares_owned+'</span></li></ul>');
	outputStats(stats);
}
