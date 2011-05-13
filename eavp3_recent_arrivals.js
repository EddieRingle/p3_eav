// Go through all of the results
$(".influencer-list").each(function() {
	// If we don't have a placeholder pic, let's check the profile stats
	if(
		$(this).find("img").attr("src") != "/public/portraits/placeholder_sm.jpg" 
		&& $(this).find("div.eavp3-profile-stats").length == 0
	) {
		port.postMessage({
			action: "getProfileData", 
			ticker: $(this).find(".influencer-title a:eq(1)").text()
		});
	}
});
// Output the stats that came back from the profile page
port.onMessage.addListener(function(msg) {
	target = $(".influencer-list").find(".influencer-title a:contains('"+msg.ticker+"')").parent().parent();
	if(target.find("div.eavp3-profile-stats").length == 0) {
		output = "<div class=\"eavp3-profile-stats\"><br>";
		for (x in msg.connections) {
			if(msg.connections[x].url)
				output += "<a href=\""+msg.connections[x].url+"\" target=\"_blank\">";
			output += x+": ";
			if(msg.connections[x].url)
				output += "</a>";
			output += msg.connections[x].value;
			output += "<br>";
		}
		target.html(target.html()+output+"</div>");
	}
});