var icons = {};
icons['safe'] = 'tree-conifer';
icons['ad'] = 'usd';
icons['anal'] = 'stats';
icons['soc'] = 'thumbs-up';
icons['none'] = 'asterix';

var markDomain = function(domainName, marker) {
  console.log("Marking Domain: "+domainName+" as "+marker);
  //domain = Domains.findOne({_id: domainName});
  var doc = {};
  doc['marker'] = marker;
  //doc['_id'] = domainName;
  //if (domain) {
    Domains.update({_id: domainName}, {"$set": doc}, {upsert: 1});
  //}
  //else {
  //  Domains.insert({_id: domainName, marker: 1});
  //}
}


if (Meteor.isClient) {
  Template.requests_list.request_table = function() {
    return Session.get("requests_result");
  }
 
  Template.request_info.parent_domain = function() {
    //console.log("in helper parent_domain");
    //console.log(this);
    var marker = 'none';
    if (this.parenturl_domain_marker)
      marker = this.parenturl_domain_marker;
    return {
      type: 'parent',
      domain: this.parenturl_domain,
      marker: this.parenturl_domain_marker,
      icon: icons[marker]
      };
  }
  Template.request_info.current_domain = function() {
    var marker = 'none';
    if (this.url_domain_marker)
      marker = this.url_domain_marker;
    return {
      type: 'url',
      domain: this.url_domain,
      marker: this.url_domain_marker,
      icon: icons[marker]
    }
  }
  Template.domain_info.events({
    "click .domain-safe-btn" : function() {
      console.log(this);
      markDomain(this.domain, 'safe');
    },
    "click .domain-ad-btn" : function() {
      markDomain(this.domain, 'ad');
    },
    "click .domain-anal-btn" : function() {
      markDomain(this.domain, 'anal');
    },
    "click .domain-soc-btn" : function() {
      markDomain(this.domain, 'safe');
    }
  });
  Template.requests_list.events({
   "click #toggle-requests-button" : function() {
      $("#requests_list_div").toggle(250);
    },
    "click #get-requests-button" : function() {
      $("#get-requests-button").prop("disabled", true).val("wait...");
      var pipe = [];
      pipe.push({$match: {"parsedURL.domain_marker": {$ne: 'safe'}}});
      pipe.push({$match: {"parsedURL.host": {$ne: "localhost"}}});
      pipe.push({$match: {"cross_domain": true}});
      pipe.push({
        $group: {
          _id: {
            type: "$type", 
            url: "$url", 
            url_domain: "$parsedURL.host", 
            url_domain_marker: "$parsedURL.domain_marker",
            parenturl_domain: "$parentURL.host",
            parenturl_domain_marker: "$parentURL.domain_marker"
          },
          num_requests: {$sum: 1}
        }
      });
      pipe.push({
        $group: {
          _id: "$_id.url",
          type: {$first: "$_id.type"},
          url_domain: {$first: "$_id.url_domain"},
          url_domain_marker: {$first: "$_id.url_domain_marker"},
          parenturl_domain: {$first: "$_id.parenturl_domain"},
          parenturl_domain_marker: {$first: "$_id.parenturl_domain_marker"},
          num_requests: {$first: "$num_requests"}
        }
      });
      pipe.push({$sort: {'num_requests': -1}});
      pipe.push({$limit: 100});
      console.log("Request Query Pipe: "+JSON.stringify(pipe));
      Requests.aggregate(pipe, function(err, requests) {
        if (requests){ 
          console.log("Found Result:"+JSON.stringify(requests));
          Session.set("requests_result", requests);
        }
        $("#get-requests-button").prop('disabled', false).val("Update Results");
      });
    }
  });
}
