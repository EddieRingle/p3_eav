function round(number, digits) {
	return Math.round(parseFloat(number*Math.pow(10, digits)))/Math.pow(10, digits);
}

function profitability(stats) {
	stats.price = round(stats.price, 3);
	stats.dividend = round(stats.dividend, 2);
	stats.yield = stats.dividend*100 / stats.price;
	stats.yield = round(stats.yield, 2);
	stats.current_breakeven = round(stats.price*1.05/0.95, 3);
	stats.current_breakeven_days = round(stats.current_breakeven/stats.dividend, 0);
	
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
	
	return stats;
}

 // Mutation event to handle the loading of stocks on a portfolio/list page
$(document).bind('DOMNodeInserted', function (e) {
	// Check to see if the influencer-stats class was added and make sure we haven't already added the daily dividend yield
	if(
		$(".influencer-stats").length == 1
		&& $(".influencer-stats ul li:contains('Daily Dividend Yield')").length == 0
		&& $(".influencer-stats ul li:contains('Shares They Own In You') span").length == 1
	) {
		// Get the stats
		stats = {};
		stats.price = $(".influencer-stats ul li:contains('Share Price') span").text().match(/^\s+(\d+\.\d+)\s/)[1];
		stats.dividend = $(".influencer-stats ul li:contains('Daily Dividend/Share') span").text();
		
		stats = profitability(stats);
		
		// Add the dividend yield to the stats
		$(".influencer-stats ul li:contains('Shares Owned By You')").before('<li><strong>Daily Dividend Yield</strong><span class="float-right">'+(stats.yield)+'%</span></li>');
		// Add the days to breakeven to the stats
		$(".influencer-stats ul li:contains('Shares Owned By You')").before('<li><strong>Approximate Dividend Pay Back (Days)</strong><span class="float-right">'+(stats.current_breakeven_days)+'</span></li>');
		// Add the current breakeven to the stats
		$(".influencer-stats ul li:contains('Shares Owned By You')").before('<li><strong>Current Break Even</strong><span class="float-right">'+(stats.current_breakeven)+'</span></li>');
		
		// Get ownership stats
		stats.shares_owned = $(".influencer-stats ul li:contains('Shares Owned By You') span").first().text().match(/(\d+)\s?/)[1];
		
		// If we have more than 0 shares, let's calculate the breakeven and real return, including commissions
		if(stats.shares_owned != "0") {
			// Get the purchase info
			stats.purchase_info_text = $(".influencer-stats ul li:contains('Value in your Portfolio') span span").text();
			
			stats = purchaseStats(stats);			
			
			// Display the profitability stats
			$(".influencer-stats ul li:contains('Shares They Own In You')").before('<li><strong>Your Average Purchase Price:</strong><span class="float-right">'+(stats.purchase_price)+'</span></li>');
			$(".influencer-stats ul li:contains('Shares They Own In You')").before('<li><strong>Your Breakeven Price:</strong><span class="float-right">'+stats.breakeven+'</span></li>');
			$(".influencer-stats ul li:contains('Shares They Own In You')").before('<li><strong>Your Real Gain per Share:</strong><span class="float-right">'+(stats.real_gain_per_share > 0 ? "+" : "")+stats.real_gain_per_share+'</span></li>');
			$(".influencer-stats ul li:contains('Shares They Own In You')").before('<li><strong>Your Real Total Gain:</strong><span class="float-right">'+(stats.real_gain_per_share > 0 ? "+" : "")+stats.real_gain+'</span></li>');
			if(stats.real_gain > 0) {
				$(".influencer-stats ul li:contains('Your Real') span").addClass("ticker-up").css("font-weight", "bold");
			}
			else if(stats.real_gain < 0) {
				$(".influencer-stats ul li:contains('Your Real') span").addClass("ticker-down").css("font-weight", "bold");
			}
		}
	}
});

// Profile page stats section example:
// <div class="stat float-left"><center><span class="small">Dividend Yield<span class=""> (weekly avg.)</span></span></center><span><span class=""><a href="#">0.32%</a></span><span class="small" style="border-right:1px solid #a1a1a1;margin-right:2px;padding-right:4px"> /day</span></span></div>

// Update the profile page with profitability stats
if(
	$("#option-bar ul li:eq(0)").attr("class") == "current"
	&& $("#nmp-stats div:eq(0) span span:eq(3)").length == 1
	&& $("#geeklad-extension-stats").length == 0
	) {
	// First remove our mutation event so we don't mess things up
	$(document).unbind('DOMNodeInserted');
	
	stats = {};
	
	stats.price = $("#nameplate-last-trade").text().replace(/\s|,/g, "");
	stats.dividend = $("#nmp-stats div:eq(0) span span:eq(3)").text();
	stats = profitability(stats);
	
	$("#profile-achieve").before('<div id="geeklad-extension-stats" style="width: 400px; margin: 0 auto" class="influencer-stats"><h3>Current Investment Analysis</h3></div><div class="clear"></div>');
	$("#geeklad-extension-stats h3").after('<ul> \
		<li><strong>Daily Dividend Yield:</strong> \
		<span class="float-right">'+stats.yield+'%</span></li> \
		<li><strong>Approximate Dividend Pay Back (Days):</strong> \
		<span class="float-right">'+stats.current_breakeven_days+'</span></li> \
		<li><strong>Current Break Even:</strong> \
		<span class="float-right">'+stats.current_breakeven+'</span></li> \
	</ul>');
	
	// Check to see if we own it
	if($("#nmp-stats div:eq(2) span:eq(5)").length == 1) {
		stats.shares_owned = $("#nmp-stats div:eq(2) span:eq(3)").text();
		stats.purchase_info_text = $("#nmp-stats div:eq(2) span:eq(5)").text();
		
		stats = purchaseStats(stats);	
		$("#geeklad-extension-stats ul").after('<h3>Your Profitability Analysis</h3><ul> \
			<li><strong>Your Average Purchase Price:</strong> \
			<span class="float-right">'+stats.purchase_price+'</span></li> \
			<li><strong>Your Break Even Price:</strong> \
			<span class="float-right">'+stats.breakeven+'</span></li> \
			<li><strong>Your Real Gain per Share:</strong> \
			<span class="float-right">'+(stats.real_gain_per_share > 0 ? "+" : "")+stats.real_gain_per_share+'</span></li> \
			<li><strong>Your Real Total gain:</strong> \
			<span class="float-right">'+(stats.real_gain_per_share > 0 ? "+" : "")+stats.real_gain+'</span></li> \
		</ul>');
		if(stats.real_gain > 0) {
			$("#geeklad-extension-stats ul li:contains('Your Real') span").addClass("ticker-up").css("font-weight", "bold");
		}
		else if(stats.real_gain < 0) {
			$("#geeklad-extension-stats ul li:contains('Your Real') span").addClass("ticker-down").css("font-weight", "bold");
		}
	}
}
