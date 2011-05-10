$('.tweet-text').each(function() {
  var html = $(this).html();
  var newhtml = html.replace(/\(e\)([A-Za-z0-9]+)/gi, '<a href="http://empireavenue.com/$1" ticker="$1">(e)$1</a>');
  newhtml = newhtml.replace(/e\(([A-Za-z0-9]+)\)/gi, '<a href="http://empireavenue.com/$1" ticker="$1">e($1)</a>');
  $(this).html(newhtml);

  $(this).find('a[ticker]').each(function() {
    var ticker = $(this).attr('ticker').toUpperCase();
    $(this).click(function() {
      $.facebox(function() {
        var port = chrome.extension.connect({name: "twitterTickerClicked"});
        port.postMessage({action: "twitterTickerClicked", target: ticker});
        port.onMessage.addListener(function(msg) {
          if (msg.apistatus === 200) {
            var json = msg.json.data[0];
            if (json.ticker == ticker) {
              var change = parseFloat(json.last_trade) - parseFloat(json.close);
              $(document).bind('afterReveal.facebox', function() {
                if (change > 0.00) {
                  $('#facebox-wrap span.change').css('color: #0F0;');
                } else {
                  $('#facebox-wrap span.change').css('color: #F00;');
                }
              });
              var changetxt;
              var color;
              if (change > 0.00) {
                changetxt = '+' + change.toFixed(2);
                color = "#308A24";
              } else if (change < 0.00) {
                changetxt = change.toFixed(2);
                color = "#D92125";
              } else {
                changetxt = change.toFixed(2);
                color = "#000";
              }
              console.log(msg);
              console.log($(msg.scrape));
              var avgdiv = $(msg.scrape).find('div.influencer-stats ul li strong:contains("Average Daily Dividend:") + span').html();
              var avgdivshare = parseFloat($(msg.scrape).find('div.influencer-stats ul li strong:contains("Average Daily Dividend/Share:") + span').html());
              var avgroi = avgdivshare / parseFloat(json.last_trade);
              $.facebox('<div id="facebox-wrap">\n'
                    + '<div class="userblock-left">\n'
                    + '<span class="ticker"><a href="http://empireavenue.com/' + ticker + '" target="_blank">' + ticker + '</a></span>\n'
                    + '<span class="name">' + json.full_name + '</span>\n'
                    + '<span class="location">' + json.location + '</span>\n'
                    + '</div>\n'
                    + '<img src="' + json.sm_portrait + '" alt="" />\n'
                    + '<div class="userblock-right">\n'
                    + '<span class="price">' + parseFloat(json.last_trade).toFixed(2) + '</span>\n'
                    + '<span class="change" style="color:' + color + '">' + changetxt + '</span>\n'
                    + '</div>\n'
                    + '<hr/>\n'
                    + '<h6>Ticker Information</h6>\n'
                    + '<div class="infoblock">\n'
                    + '<table>\n'
                    + '<tr class="grayblock"><td>Joined:</td>\n'
                    + '<td>' + (new Date(json.joined)).toDateString() + '</td></tr>\n'
                    + '<tr class="laststatus"><td>Last Status:</td>\n'
                    + '<td>' + json.current_status + '</td></tr>\n'
                    + '<tr class="grayblock sharesoutstanding"><td>Shares Outstanding:</td>\n'
                    + '<td>' + parseInt(json.outstanding_shares) + ' / ' + parseInt(json.total_shares) + '</td></tr>\n'
                    + '<tr class="shareholders"><td>Shareholders:</td>\n'
                    + '<td>' + parseInt(json.shareholders_count) + '</td></tr>\n'
                    + '<tr class="grayblock investments"><td>Investments:</td>\n'
                    + '<td>' + parseInt(json.investments_count) + '</td></tr>\n'
                    + '<tr class="sharesinyou"><td>Shares in You:</td>\n'
                    + '<td>' + parseInt(json.held_shares) + '</td></tr>\n'
                    + '<tr class="grayblock sharesyouown scrape"><td>Shares You Own</td>\n'
                    + '<td>' + $(msg.scrape).find('#held_shares_' + json.ticker).html() + '</td></tr>\n'
                    + '<tr class="avgdividend scrape"><td>Average Daily Dividend:</td>\n'
                    + '<td>' + avgdiv + '</td></tr>\n'
                    + '<tr class="grayblock avgdivshare scrape"><td>Avg. Daily Div/Share:</td>\n'
                    + '<td>' + avgdivshare + '</td></tr>\n'
                    + '<tr class="avgroi scrape"><td>Current Average ROI</td>\n'
                    + '<td>' + (avgroi * 100.0).toFixed(2) + '%</td></tr>\n'
                    + '</table>\n'
                    + '</div>\n'
                    + '<span class="p3notice"></span>\n'
                    + '<span class="poweredbyp3">Powered by P&#179; for Empire Avenue</span>\n'
                    + '</div>\n');
              if (msg.scrape.match(/^<!DOCTYPE/)) {
                $('#facebox .infoblock table tr.scrape').hide();
                $('#facebox span.p3notice').html('<a href="http://empireavenue.com/user/login" target="_blank">Stay logged in to Empire Avenue\'s site</a> to see more infomation here.');
              }
              if (json.ticker == msg.username) {
                $('#facebox .infoblock table tr.sharesyouown').hide();
                $('#facebox .infoblock table tr.sharesinyou').hide();
              }
            } else {
              $.facebox('Sorry, that ticker does not exist.');
            }
          } else {
            $.facebox('<p>An error occurred while accessing the server. This could be caused by a couple of reasons:</p>\n'
              + '<ul>\n'
              + '<li>Empire Avenue\'s servers are currently down</li>\n'
              + '<li>You\'ve hit the API limit for this hour</li>\n'
              + '</ul>\n'
              + '<p>Please try again later.</p>');
          }
        });
      });
      chrome.extension.sendRequest('twitter_ticker_clicked');
      return false;
    });
  });
});
