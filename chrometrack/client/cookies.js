if (Meteor.isClient) {

  Template.cookies_list.cookie_result = function() {
    return Session.get("cookie_result");
  }

  Template.cookie_domain_info.selected_cookies = function() {
    if (!Session.equals("selected_cookie_domain", this._id)) return false;
    var selected_id = Session.get("selected_cookie_domain");
    return Cookies.find({domain: selected_id});
    return undefined;
  }

  Template.cookie_domain_info.selected_row = function() {
    return Session.equals("selected_cookie_domain", this._id)? "selected error" : "";
  }

  Template.cookies_list.events({
    "click": function() {
      console.log("Selected Domain: "+this._id);
      Session.set("selected_cookie_domain", this._id);
    },
    "click #hide-cookies-button" : function() {
      console.log("Hiding Cookies List");
      $("#cookies_list_div").toggle(250);
    },
    "click #get-cookies-button": function() {
      $("#get-cookies-button").prop("disabled", true).val("Wait...");
      var pipe = [];
      pipe.push({
        $group: {
          _id: "$domain",
          numCookies: {$sum: 1}
        },
      });
      pipe.push({$sort: {numCookies: -1}});
      pipe.push({$limit: 25})
      
      console.log("Pipe:"+JSON.stringify(pipe));

      Cookies.aggregate(pipe, function(err, cookies) {
        if (cookies) {
          console.log("Found result:"+JSON.stringify(cookies));
          Session.set("cookie_result", cookies);
        }
        $("#get-cookies-button").prop("disabled", false).val("Update List");
      });
    }
  });
}


