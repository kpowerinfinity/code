Colors = new Meteor.Collection("colors");
Cookies = new Meteor.Collection("cookies");
Requests = new Meteor.Collection("requests");
Domains = new Meteor.Collection("domains");


if (Meteor.isClient) {
  Template.color_list.colors = function() {
    console.log("Finding Colors: Num-Found:" + Colors.find().count());
    return Colors.find();
  };

  Template.color_list.color_count = function() {
    return Colors.find().count();
  };

  Template.add_color.error = function() {
    return Session.get("error");
  };

  Template.add_color.events = {
    'click input.add-color' : function() {
      var addColorName = document.getElementById("new_color_name").value.trim();
      console.log("Adding color: "+addColorName);
      if (Validation.valid_name(addColorName)) {
        Colors.insert({name: addColorName});
      }
      document.getElementById("new_color_name").value="";
    }
  };

  Template.color_info.events = {
    'click input.delete': function () {
      Colors.remove(this._id);
    }
  };
}

if (Meteor.isServer) {
  Meteor.startup(function() {
      collectionApi = new CollectionAPI({});

      collectionApi.addCollection(Colors, 'colors');
      collectionApi.addCollection(Cookies, 'cookies');
      collectionApi.addCollection(Requests, 'requests');

      collectionApi.start();
      });

}

Validation = {
clear: function() {
         return Session.set("error", undefined);
       },
set_error: function(msg) {
             return Session.set("error", msg);
           },
valid_name: function(name) {
              this.clear();
              if (name.length == 0) {
                this.set_error("Name can't be blank");
                return false;
              } else if (this.color_exists(name)) {
                this.set_error("color already exists");
                return false;
              } else {
                return true;
              }
            },
color_exists: function(name) {
                return Colors.findOne({name: name});
              }
};
