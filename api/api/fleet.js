/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

'use strict'

/* eslint camelcase: 0 */
/* eslint no-unused-vars: 0 */

const { handleError, snakeCaseKeys, normalizeArguments, kConfigurationError } = require('../utils')
const acceptedQuerystring = ['wait_for_advance', 'wait_for_index', 'checkpoints', 'timeout', 'pretty', 'human', 'error_trace', 'source', 'filter_path', 'wait_for_checkpoints', 'wait_for_checkpoints_timeout', 'allow_partial_search_results']
const snakeCase = { waitForAdvance: 'wait_for_advance', waitForIndex: 'wait_for_index', errorTrace: 'error_trace', filterPath: 'filter_path', waitForCheckpoints: 'wait_for_checkpoints', waitForCheckpointsTimeout: 'wait_for_checkpoints_timeout', allowPartialSearchResults: 'allow_partial_search_results' }

function FleetApi (transport, ConfigurationError) {
  this.transport = transport
  this[kConfigurationError] = ConfigurationError
}

FleetApi.prototype.globalCheckpoints = function fleetGlobalCheckpointsApi (params, options, callback) {
  ;[params, options, callback] = normalizeArguments(params, options, callback)

  // check required parameters
  if (params.index == null) {
    const err = new this[kConfigurationError]('Missing required parameter: index')
    return handleError(err, callback)
  }

  let { method, body, index, ...querystring } = params
  querystring = snakeCaseKeys(acceptedQuerystring, snakeCase, querystring)

  let path = ''
  if (method == null) method = 'GET'
  path = '/' + encodeURIComponent(index) + '/' + '_fleet' + '/' + 'global_checkpoints'

  // build request object
  const request = {
    method,
    path,
    body: null,
    querystring
  }

  return this.transport.request(request, options, callback)
}

FleetApi.prototype.msearch = function fleetMsearchApi (params, options, callback) {
  ;[params, options, callback] = normalizeArguments(params, options, callback)

  // check required parameters
  if (params.body == null) {
    const err = new this[kConfigurationError]('Missing required parameter: body')
    return handleError(err, callback)
  }

  let { method, body, index, ...querystring } = params
  querystring = snakeCaseKeys(acceptedQuerystring, snakeCase, querystring)

  let path = ''
  if ((index) != null) {
    if (method == null) method = body == null ? 'GET' : 'POST'
    path = '/' + encodeURIComponent(index) + '/' + '_fleet' + '/' + '_fleet_msearch'
  } else {
    if (method == null) method = body == null ? 'GET' : 'POST'
    path = '/' + '_fleet' + '/' + '_fleet_msearch'
  }

  // build request object
  const request = {
    method,
    path,
    bulkBody: body,
    querystring
  }

  return this.transport.request(request, options, callback)
}

FleetApi.prototype.search = function fleetSearchApi (params, options, callback) {
  ;[params, options, callback] = normalizeArguments(params, options, callback)

  // check required parameters
  if (params.index == null) {
    const err = new this[kConfigurationError]('Missing required parameter: index')
    return handleError(err, callback)
  }

  let { method, body, index, ...querystring } = params
  querystring = snakeCaseKeys(acceptedQuerystring, snakeCase, querystring)

  let path = ''
  if (method == null) method = body == null ? 'GET' : 'POST'
  path = '/' + encodeURIComponent(index) + '/' + '_fleet' + '/' + '_fleet_search'

  // build request object
  const request = {
    method,
    path,
    body: body || '',
    querystring
  }

  return this.transport.request(request, options, callback)
}

Object.defineProperties(FleetApi.prototype, {
  global_checkpoints: { get () { return this.globalCheckpoints } }
})

module.exports = FleetApi