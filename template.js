;(function () {
  var template = Handlebars.template,
    templates = (Handlebars.templates = Handlebars.templates || {})
  templates['batchButton'] = template({
    compiler: [8, '>= 4.3.0'],
    main: function (container, depth0, helpers, partials, data) {
      return '<div class="batchButton mr-3">\r\n    <button type="button" class="btn btn-primary">Batch Clone</button>\r\n</div>'
    },
    useData: true,
  })
  templates['batchModal'] = template({
    compiler: [8, '>= 4.3.0'],
    main: function (container, depth0, helpers, partials, data) {
      return '<div id="batchModal" class="modal fade" role="dialog">\r\n    <div class="modal-dialog">\r\n        <div class="modal-content">\r\n            <div class="modal-header">\r\n                <button type="button" class="close" data-dismiss="modal">&times;</button>\r\n                <h4 class="modal-title">Kamino - Batch Clone(Experimental!)</h4>\r\n            </div>\r\n            <div class="modal-body">\r\n                <p>Select a destination repository:</p>\r\n                <div class="batchRepoDropdownContainer">\r\n                    <input class="repoSearch" type="text" placeholder="Search for a repo..." />\r\n                    <hr />\r\n                    <select class="repoDropdown"></select>\r\n                </div>\r\n\r\n                <p style="margin-top: 33px;">Select issues:</p>\r\n                <div class="batchIssuesContainer"></div>\r\n\r\n                <div class=\'message\'></div>\r\n            </div>\r\n            <div class="modal-footer">\r\n                <button type="button" class="btn btn-primary cloneAndClose" style="margin-right:20px;"\r\n                    data-dismiss="modal" data-repo="">Clone and Close</button>\r\n                <button type="button" class="btn btn-primary cloneAndKeepOpen" style="margin-right:20px;"\r\n                    data-dismiss="modal" data-repo="">Just Clone</button>\r\n                <button type="button" class="btn btn-info noClone" data-dismiss="modal">Nevermind</button>\r\n            </div>\r\n        </div>\r\n    </div>\r\n</div>'
    },
    useData: true,
  })
  templates['button'] = template({
    compiler: [8, '>= 4.3.0'],
    main: function (container, depth0, helpers, partials, data) {
      return '<div class="discussion-sidebar-item sidebar-kamino">\n    <button class="discussion-sidebar-heading kamino-heading discussion-sidebar-toggle js-menu-target">\n    <svg class="octicon octicon-gear" viewBox="0 0 14 16" version="1.1" width="14" height="16" aria-hidden="true">\n        <path fill-rule="evenodd" d="M14 8.77v-1.6l-1.94-.64-.45-1.09.88-1.84-1.13-1.13-1.81.91-1.09-.45-.69-1.92h-1.6l-.63 1.94-1.11.45-1.84-.88-1.13 1.13.91 1.81-.45 1.09L0 7.23v1.59l1.94.64.45 1.09-.88 1.84 1.13 1.13 1.81-.91 1.09.45.69 1.92h1.59l.63-1.94 1.11-.45 1.84.88 1.13-1.13-.92-1.81.47-1.09L14 8.75v.02zM7 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"></path>\n    </svg>\n    Kamino\n    </button>\n    \n    <div class="btn-group" role="group">\n        <button type="button" class="btn btn-sm btn-primary quickClone">Clone to</button>\n        <button type="button" class="btn btn-sm btn-primary dropdown-toggle kaminoButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">\n            <span class="caret"></span>\n            <span class="sr-only">Toggle Dropdown</span>\n        </button>\n\n        <div class="dropdown-menu repoDropdownContainer">\n            <input class="repoSearch" type="text" placeholder="Search for a repo..." />\n            <hr/>\n            <ul class="repoDropdown"></ul>\n        </div>\n    </div>\n</div>'
    },
    useData: true,
  })
  templates['modal'] = template({
    compiler: [8, '>= 4.3.0'],
    main: function (container, depth0, helpers, partials, data) {
      var helper,
        lookupProperty =
          container.lookupProperty ||
          function (parent, propertyName) {
            if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
              return parent[propertyName]
            }
            return undefined
          }

      return (
        '<div id="kaminoModal" class="modal fade" role="dialog">\n    <div class="modal-dialog">\n        <div class="modal-content">\n            <div class="modal-header">\n                <button type="button" class="close" data-dismiss="modal">&times;</button>\n                <h4 class="modal-title">Kamino - Confirm Clone</h4>\n            </div>\n            <div class="modal-body">\n                <p class="confirmText">' +
        container.escapeExpression(
          ((helper =
            (helper =
              lookupProperty(helpers, 'confirmText') ||
              (depth0 != null ? lookupProperty(depth0, 'confirmText') : depth0)) != null
              ? helper
              : container.hooks.helperMissing),
          typeof helper === 'function'
            ? helper.call(depth0 != null ? depth0 : container.nullContext || {}, {
                name: 'confirmText',
                hash: {},
                data: data,
                loc: { start: { line: 9, column: 39 }, end: { line: 9, column: 54 } },
              })
            : helper)
        ) +
        '</p>\n            </div>\n            <div class="modal-footer">\n                <button type="button" class="btn btn-primary cloneAndClose" style="margin-right:20px;" data-dismiss="modal" data-repo="">Clone and Close</button>\n                <button type="button" class="btn btn-primary cloneAndKeepOpen" style="margin-right:20px;" data-dismiss="modal" data-repo="">Just Clone</button>\n                <button type="button" class="btn btn-info noClone" data-dismiss="modal">Nevermind</button>\n            </div>\n        </div>\n    </div>\n</div>'
      )
    },
    useData: true,
  })
})()
