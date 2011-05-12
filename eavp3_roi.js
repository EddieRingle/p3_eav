jQuery(document).ready(function($) {
  if ($('span.eavroi').length == 0) {
    var currency = $('#eavtitle div.price span.currency');
    var price = $('a', currency).html().trim();
    var dividend;
    var divamt;
    try {
      dividend = $('#nmp-stats div:first > span:last > span:first > a').html().trim();
      divamt = $('#nmp-stats div:first > span:first > span:first > a').html().trim();
    } catch(e) {
      // If at first you don't succeed, try/catch again
      try {
        dividend = $('#nmp-stats div:nth-child(4) > span:last > span:first > a').html().trim();
        divamt = $('#nmp-stats div:nth-child(4) > span:first > span:first > a').html().trim();
      } catch(e) {
        return;  // Give it up already
      }
    }

    divamt = divamt.replace(/\,/g, '');

    var roi = dividend / price;
    var roip = parseFloat((roi * 100).toFixed(2));

    if (divamt >= 150000) {
      roip += 0.2;
    }

    var color;

    if (roip <= 0.65) {
      color = "#CC0033";
    } else if(roip >= 0.75 && roip < 1.00) {
      color = "#FFBB00";
    } else if (roip >= 1.00 && roip < 2.00) {
      color = "#009900";
    } else if (roip >= 2.00) {
      color = "#0075F5";
    } else {
      color = "#000";
    }

    if (divamt >= 150000) {
      roip -= 0.2;
    }
    currency.append('<br/><span class="eavroi" style="font-size: 12px;display:none;">ROI Right Now: <span style="color:' + color + ';">' + roip.toFixed(2) + '%</span></span>');
    $('span.eavroi').fadeIn();
  }
});
