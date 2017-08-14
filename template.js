(function() {
  var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};
templates['button'] = template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<div class=\"sidebar-kamino\">\r\n    <h3 class=\"discussion-sidebar-heading\">Kamino</h3>\r\n    <div class=\"btn-group\">\r\n        <button type=\"button\" class=\"btn btn-sm btn-primary quickClone\">Clone to</button>\r\n        <button type=\"button\" class=\"btn btn-sm btn-primary dropdown-toggle kaminoButton\" data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"false\">\r\n            <span class=\"caret\"></span>\r\n            <span class=\"sr-only\">Toggle Dropdown</span>\r\n        </button>\r\n        <ul class=\"dropdown-menu repoDropdown\"></ul>\r\n    </div>\r\n</div>";
},"useData":true});
templates['modal'] = template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper;

  return "<div id=\"kaminoModal\" class=\"modal fade\" role=\"dialog\">\r\n    <div class=\"modal-dialog\">\r\n        <div class=\"modal-content\">\r\n            <div class=\"modal-header\">\r\n                <button type=\"button\" class=\"close\" data-dismiss=\"modal\">&times;</button>\r\n                <h4 class=\"modal-title\">Kamino - Confirm Clone</h4>\r\n            </div>\r\n            <div class=\"modal-body\">\r\n                <p class=\"confirmText\">"
    + container.escapeExpression(((helper = (helper = helpers.confirmText || (depth0 != null ? depth0.confirmText : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"confirmText","hash":{},"data":data}) : helper)))
    + "</p>\r\n            </div>\r\n            <div class=\"modal-footer\">\r\n                <button type=\"button\" class=\"btn btn-primary cloneNow\" style=\"margin-right:20px;\" data-dismiss=\"modal\" data-repo=\"\">Yes</button>\r\n                <button type=\"button\" class=\"btn btn-info noClone\" data-dismiss=\"modal\">No</button>\r\n            </div>\r\n        </div>\r\n    </div>\r\n</div>";
},"useData":true});
})();