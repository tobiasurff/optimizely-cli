var Promise = require("bluebird");
var rest = require('restler');
var _ = require('lodash');

var methodNamesToPromisify =
  "get post put del head patch json postJson putJson".split(" ");

function EventEmitterPromisifier(originalMethod) {
  // return a function
  return function promisified() {
    var args = [].slice.call(arguments);
    // Needed so that the original method can be called with the correct receiver
    var self = this;
    // which returns a promise
    return new Promise(function(resolve, reject) {
      // We call the originalMethod here because if it throws,
      // it will reject the returned promise with the thrown error
      var emitter = originalMethod.apply(self, args);

      emitter
        .on("success", function(data, response) {
          resolve([data, response]);
        })
        .on("fail", function(data, response) {
          // Erroneous response like 400
          reject({
            message: data.toString()
          });
          // resolve([data, response]);
        })
        .on("error", function(err) {
          reject(err);
        })
        .on("abort", function() {
          reject(new Promise.CancellationError());
        })
        .on("timeout", function() {
          reject(new Promise.TimeoutError());
        });
    });
  };
};

Promise.promisifyAll(rest, {
  filter: function(name) {
    return methodNamesToPromisify.indexOf(name) > -1;
  },
  promisifier: EventEmitterPromisifier
});

function OptimizelyClient(apiToken, baseUrl) {
  //initialize
  this.apiToken = apiToken;
  this.baseUrl = baseUrl ||
    'https://www.optimizelyapis.com/experiment/v1/';
}

OptimizelyClient.prototype.createProject = function(name, status, jquery, ip) {
  var postUrl = this.baseUrl + 'projects/';
  return rest.postAsync(postUrl, {
    method: 'post',
    headers: {
      'Token': this.apiToken,
      'Content-Type': 'application/json'
    },
    data: JSON.stringify({
      'project_name': name,
      'status': status,
      'include_jquery': !!jquery,
      'ip_filter': ip || ""
    })
  }).then(function(createdProjects) {
    return createdProjects[0];
  });
}
OptimizelyClient.prototype.getProject = function(project_id) {
  var theUrl = this.baseUrl + 'projects/' + project_id;
  return rest.getAsync(theUrl, {
    method: 'get',
    headers: {
      'Token': this.apiToken,
      'Content-Type': 'application/json'
    }
  }).then(function(experimentset) {
    return experimentset[0];
  }, function(error) {
    console.log("error retrieving projetct", error.message)
  });
}

OptimizelyClient.prototype.getExperiments = function(project_id) {
  var theUrl = this.baseUrl + 'projects/' + project_id + '/experiments/';
  return rest.getAsync(theUrl, {
    method: 'get',
    headers: {
      'Token': this.apiToken,
      'Content-Type': 'application/json'
    }
  }).then(function(experimentset) {
    return experimentset[0];
  });
}
OptimizelyClient.prototype.getExperiment = function(exp_id) {
  var theUrl = this.baseUrl + 'experiments/' + exp_id;
  return rest.getAsync(theUrl, {
    method: 'get',
    headers: {
      'Token': this.apiToken,
      'Content-Type': 'application/json'
    }
  }).then(function(experimentset) {
    return experimentset[0];
  });
}
OptimizelyClient.prototype.updateExperiment = function(args) {
  var theUrl = this.baseUrl + 'experiments/' + String(
    args['id']);
  return rest.putAsync(theUrl, {
    method: 'put',
    headers: {
      'Token': this.apiToken,
      'Content-Type': 'application/json'
    },
    data: JSON.stringify({
      'description': args['description'],
      'edit_url': args['edit_url'],
      'custom_css': args['custom_css'],
      'custom_js': args['custom_js']
    })
  }).then(function(experimentset) {
    return experimentset[0];
  });
}

OptimizelyClient.prototype.getExperimentByDescription = function(project_id,
  description) {
  return this.getExperiments(project_id).spread(function(data, response) {
    return _.find(data, function(experiment) {
      return experiment['description'] ===
        description;
    });
  })
}

OptimizelyClient.prototype.createExperiment = function(args) {
  var postUrl = this.baseUrl + 'projects/' + args['project_id'].toString() +
    '/experiments/';
  return rest.postAsync(postUrl, {
    method: 'post',
    headers: {
      'Token': this.apiToken,
      'Content-Type': 'application/json'
    },
    data: JSON.stringify({
      'edit_url': args['edit_url'],
      'description': args['description'],
      'custom_js': args['custom_js'],
      'custom_css': args['custom_css'],
      'url_conditions': [{'value': args['edit_url'], 'match_type': 'simple'}]
    })
  }).then(function(result) {
    return result[0];
  });
}

OptimizelyClient.prototype.getVariation = function(variationId) {
  var theUrl = this.baseUrl + 'variations/' + variationId.toString();
  return rest.getAsync(theUrl, {
    method: 'get',
    headers: {
      'Token': this.apiToken,
      'Content-Type': 'application/json'
    }
  });
}
OptimizelyClient.prototype.getVariationB = function(variationId) {
  var theUrl = this.baseUrl + 'variations/' + variationId.toString();
  return rest.getAsync(theUrl, {
    method: 'get',
    headers: {
      'Token': this.apiToken,
      'Content-Type': 'application/json'
    }
  }).then(function(variationset) {
    return variationset[0];
  });
}

OptimizelyClient.prototype.ation = function(variationId, args) {
  var putUrl = this.baseUrl + 'variations/' + variationId.toString();
  return rest.putAsync(putUrl, {
    method: 'put',
    headers: {
      'Token': this.apiToken,
      'Content-Type': 'application/json'
    },
    data: JSON.stringify({
      'js_component': args['js_component'],
      'description': args['description']
    })
  });
}

OptimizelyClient.prototype.createVariationB = function(experiment_id,
  description) {
  var postUrl = this.baseUrl + 'experiments/' + experiment_id +
    '/variations/';
  return rest.postAsync(postUrl, {
    method: 'post',
    headers: {
      'Token': this.apiToken,
      'Content-Type': 'application/json'
    },
    data: JSON.stringify({
      'description': description
    })
  }).then(function(variationset) {
    return variationset[0];
  });;
}

OptimizelyClient.prototype.createVariation = function(args) {
  var postUrl = this.baseUrl + 'experiments/' + args['experiment_id'].toString() +
    '/variations/';
  return rest.postAsync(postUrl, {
    method: 'post',
    headers: {
      'Token': this.apiToken,
      'Content-Type': 'application/json'
    },
    data: JSON.stringify({
      'description': args['description'],
      'js_component': args['js_component']
    })
  }).then(function(result) {
    return result[0];
  }, function(error) {
    console.log(error)
  });
}

OptimizelyClient.prototype.updateVariation = function(args) {
  var theUrl = this.baseUrl + 'variations/' + args['id'];
  return rest.putAsync(theUrl, {
    method: 'put',
    headers: {
      'Token': this.apiToken,
      'Content-Type': 'application/json'
    },
    data: JSON.stringify({
      'description': args['description'],
      'js_component': args['js_component'],
    })
  }).then(function(result) {
    return result[0];
  }, function(error) {
    console.log(error)
  });
}

module.exports = OptimizelyClient;
