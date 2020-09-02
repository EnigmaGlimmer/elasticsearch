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

/* eslint camelcase: 0 */
/* eslint no-undef: 0 */
/* eslint no-use-before-define: 0 */
/* eslint no-redeclare: 0 */

import deepMerge from 'deepmerge'
import * as t from './types'

function Q (...blocks: t.AnyQuery[]): Record<string, any> {
  const { aggs,
    collapse,
    explain,
    from,
    highlight,
    indices_boost,
    min_score,
    post_filter,
    profile,
    rescore,
    script_fields,
    search_after,
    size,
    slice,
    sort,
    _source,
    suggest,
    terminate_after,
    timeout,
    track_scores,
    version,
    ...queries
  } = Object.assign.apply({}, blocks.flat())

  const query: t.AnyQuery[] = Object.keys(queries).map(q => ({ [q]: queries[q] }))
  const body: Record<string, any> = query.length > 0 ? Q.bool(...query) : {}
  if (aggs) body.aggs = aggs
  if (collapse) body.collapse = collapse
  if (explain) body.explain = explain
  if (from) body.from = from
  if (highlight) body.highlight = highlight
  if (indices_boost) body.indices_boost = indices_boost
  if (min_score) body.min_score = min_score
  if (post_filter) body.post_filter = post_filter
  if (profile) body.profile = profile
  if (rescore) body.rescore = rescore
  if (script_fields) body.script_fields = script_fields
  if (search_after) body.search_after = search_after
  if (size) body.size = size
  if (slice) body.slice = slice
  if (sort) body.sort = sort
  if (_source) body._source = _source
  if (suggest) body.suggest = suggest
  if (terminate_after) body.terminate_after = terminate_after
  if (timeout) body.timeout = timeout
  if (track_scores) body.track_scores = track_scores
  if (version) body.version = version

  return body
}

Object.defineProperty(Q, 'name', { writable: true })

Q.param = function param (key: string) {
  return `###${key}###`
}

Q.compile = function compile<TInput = unknown> (query: Record<string, any>): t.compiledFunction<TInput> {
  let stringified = JSON.stringify(query)
  const keys: string[] = []
  const matches = stringified.match(/"###\w+###"/g)
  if (matches === null) {
    throw new Error('The query does not contain any use of `Q.params`')
  }
  for (const match of matches) {
    const key = match.slice(4, -4)
    keys.push(key)
    stringified = stringified.replace(new RegExp(match), `input[${JSON.stringify(key)}]`)
  }
  const code = `
    if (input == null) {
      throw new Error('Input must not be empty')
    }
    const keys = ${JSON.stringify(keys)}
    for (const key of keys) {
      if (input[key] === undefined) {
        throw new Error('Missing key: ' + key)
      }
    }
    return ${stringified}
  `
  // @ts-ignore
  return new Function('input', code) // eslint-disable-line
}

function match (key: string, val: string, opts?: Record<string, any>): t.Condition
function match (key: string, val: string[], opts?: Record<string, any>): t.Condition[]
function match (key: string, val: any, opts?: Record<string, any>): t.Condition | t.Condition[] {
  return generateQueryObject('match', key, val, opts)
}
Q.match = match

Q.matchPhrase = function matchPhrase (key: string, val: string, opts?: Record<string, any>): t.Condition {
  return generateQueryObject('match_phrase', key, val, opts)
}

Q.matchPhrasePrefix = function matchPhrasePrefix (key: string, val: string, opts?: Record<string, any>): t.Condition {
  return generateQueryObject('match_phrase_prefix', key, val, opts)
}

Q.multiMatch = function multiMatch (keys: string[], val: string, opts?: Record<string, any>): t.Condition {
  return {
    multi_match: {
      query: val,
      fields: keys,
      ...opts
    }
  }
}

Q.matchAll = function matchAll (opts?: Record<string, any>): t.Condition {
  return { match_all: { ...opts } }
}

Q.matchNone = function matchNone (): t.Condition {
  return { match_none: {} }
}

Q.common = function common (key: string, val: string, opts: Record<string, any>): t.Condition {
  return generateQueryObject('common', key, val, opts)
}

Q.queryString = function queryString (val: string, opts: Record<string, any>): t.Condition {
  return {
    query_string: {
      query: val,
      ...opts
    }
  }
}

Q.simpleQueryString = function simpleQueryString (val: string, opts: Record<string, any>): t.Condition {
  return {
    simple_query_string: {
      query: val,
      ...opts
    }
  }
}

Q.term = function term (key: string, val: string | string[], opts?: Record<string, any>): t.Condition {
  if (Array.isArray(val)) {
    return Q.terms(key, val, opts)
  }
  return generateValueObject('term', key, val, opts)
}

Q.terms = function terms (key: string, val: string[], opts?: Record<string, any>): t.Condition {
  return {
    terms: {
      [key]: val,
      ...opts
    }
  }
}

Q.termsSet = function termsSet (key: string, val: string[], opts: Record<string, any>): t.Condition {
  return {
    terms_set: {
      [key]: {
        terms: val,
        ...opts
      }
    }
  }
}

Q.range = function range (key: string, val: any): t.Condition {
  return { range: { [key]: val } }
}

function exists (key: string): t.Condition
function exists (key: string[]): t.Condition[]
function exists (key: string | string[]): t.Condition | t.Condition[] {
  if (Array.isArray(key)) {
    return key.map(k => exists(k))
  }
  return { exists: { field: key } }
}
Q.exists = exists

function prefix (key: string, val: string, opts?: Record<string, any>): t.Condition
function prefix (key: string, val: string[], opts?: Record<string, any>): t.Condition[]
function prefix (key: string, val: any, opts?: Record<string, any>): t.Condition | t.Condition[] {
  return generateValueObject('prefix', key, val, opts)
}
Q.prefix = prefix

function wildcard (key: string, val: string, opts?: Record<string, any>): t.Condition
function wildcard (key: string, val: string[], opts?: Record<string, any>): t.Condition[]
function wildcard (key: string, val: any, opts?: Record<string, any>): t.Condition | t.Condition[] {
  return generateValueObject('wildcard', key, val, opts)
}
Q.wildcard = wildcard

function regexp (key: string, val: string, opts?: Record<string, any>): t.Condition
function regexp (key: string, val: string[], opts?: Record<string, any>): t.Condition[]
function regexp (key: string, val: any, opts?: Record<string, any>): t.Condition | t.Condition[] {
  return generateValueObject('regexp', key, val, opts)
}
Q.regexp = regexp

function fuzzy (key: string, val: string, opts?: Record<string, any>): t.Condition
function fuzzy (key: string, val: string[], opts?: Record<string, any>): t.Condition[]
function fuzzy (key: string, val: any, opts?: Record<string, any>): t.Condition | t.Condition[] {
  return generateValueObject('fuzzy', key, val, opts)
}
Q.fuzzy = fuzzy

Q.ids = function ids (key: string, val: string[], opts: Record<string, any>): t.Condition {
  return {
    ids: {
      [key]: {
        values: val,
        ...opts
      }
    }
  }
}

Q.must = function must (...queries: t.AnyQuery[]): t.MustClause {
  return { must: queries.flatMap(mergeableMust) }
}

Q.should = function should (...queries: t.AnyQuery[]): t.ShouldClause {
  return { should: queries.flatMap(mergeableShould) }
}

Q.mustNot = function mustNot (...queries: t.AnyQuery[]): t.MustNotClause {
  return { must_not: queries.flatMap(mergeableMustNot) }
}

Q.filter = function filter (...queries: t.AnyQuery[]): t.FilterClause {
  return { filter: queries.flatMap(mergeableFilter) }
}

Q.bool = function bool (...queries: t.AnyQuery[]): t.BoolQuery {
  if (queries.length === 0) {
    return { query: { bool: {} } }
  }

  const normalizedQueries: t.BoolQueryOptions[] = queries
    .flat()
    .filter(val => {
      // filters empty objects/arrays as well
      if (typeof val === 'object' && val != null) {
        return Object.keys(val).length > 0
      }
      return !!val
    })
    .map(q => {
      if (isBool(q)) {
        if (q.query.bool._name) {
          return { must: [q.query] }
        }
        return q.query.bool
      }

      if (isClause(q)) {
        return q
      }

      return { must: [q] }
    })

  const clauseCount = {
    must: 0,
    should: 0,
    must_not: 0,
    filter: 0
  }
  for (let i = 0; i < normalizedQueries.length; i++) {
    const q = normalizedQueries[i]
    if (q.must !== undefined) { clauseCount.must++ }
    if (q.should !== undefined) { clauseCount.should++ }
    if (q.must_not !== undefined) { clauseCount.must_not++ }
    if (q.filter !== undefined) { clauseCount.filter++ }
  }

  // if there is at least one should, we cannot deep merge
  // multiple clauses, so we check how many clauses we have per type
  // and we throw an error if there is more than one per type
  if (clauseCount.should > 0) {
    if (clauseCount.must > 1 || clauseCount.must_not > 1 || clauseCount.filter > 1) {
      throw new Error('Cannot merge this query')
    }
  }

  const bool: t.BoolQueryOptions = deepMerge.all(normalizedQueries)

  // if there are not should clauses,
  // we can safely deepmerge queries
  return {
    query: {
      bool: optimize(bool)
    }
  }
}

// Tries to flat the query based on the content
function optimize (q: t.BoolQueryOptions): t.BoolQueryOptions {
  const clauses: t.BoolQueryOptions = {}

  if (q.minimum_should_match !== undefined ||
      q.should !== undefined || q._name !== undefined) {
    return q
  }

  if (q.must) {
    for (const c of q.must) {
      if (isBoolBlock(c)) {
        if (c.bool.should || c.bool._name) {
          clauses.must = clauses.must || []
          clauses.must.push(c)
        } else {
          // if we are in a BoolBlock and there is not a should clause
          // then we can "merge up" the other clauses safely
          if (c.bool.must) {
            clauses.must = clauses.must || []
            clauses.must.push.apply(clauses.must, c.bool.must)
          }

          if (c.bool.must_not) {
            clauses.must_not = clauses.must_not || []
            clauses.must_not.push.apply(clauses.must_not, c.bool.must_not)
          }

          if (c.bool.filter) {
            clauses.filter = clauses.filter || []
            clauses.filter.push.apply(clauses.filter, c.bool.filter)
          }
        }
      } else {
        clauses.must = clauses.must || []
        clauses.must.push(c)
      }
    }
  }

  if (q.filter) {
    for (const c of q.filter) {
      if (isBoolBlock(c)) {
        if (c.bool.should || c.bool.must_not || c.bool._name) {
          clauses.filter = clauses.filter || []
          clauses.filter.push(c)
        } else {
          // if there are must clauses and we are inside
          // a filter clause, we can safely move them to the upper
          // filter clause, since the score is not influenced
          if (c.bool.must) {
            clauses.filter = clauses.filter || []
            clauses.filter.push.apply(clauses.filter, c.bool.must)
          }

          if (c.bool.filter) {
            clauses.filter = clauses.filter || []
            clauses.filter.push.apply(clauses.filter, c.bool.filter)
          }
        }
      } else {
        clauses.filter = clauses.filter || []
        clauses.filter.push(c)
      }
    }
  }

  if (q.must_not) {
    for (const c of q.must_not) {
      if (isBoolBlock(c)) {
        if (c.bool.should || c.bool.filter || c.bool._name) {
          clauses.must_not = clauses.must_not || []
          clauses.must_not.push(c)
        } else {
          // if 'c' is a BoolBlock and there are only must and must_not,
          // then we can swap them safely
          if (c.bool.must) {
            clauses.must_not = clauses.must_not || []
            clauses.must_not.push.apply(clauses.must_not, c.bool.must)
          }

          if (c.bool.must_not) {
            clauses.must = clauses.must || []
            clauses.must.push.apply(clauses.must, c.bool.must_not)
          }
        }
      } else {
        clauses.must_not = clauses.must_not || []
        clauses.must_not.push(c)
      }
    }
  }

  return clauses
}

Q.and = function and (...queries: t.AnyQuery[]): t.BoolQuery {
  let query = queries[0]
  for (let i = 1; i < queries.length; i++) {
    query = andOp(query, queries[i])
  }
  return query as t.BoolQuery

  function andOp (q1: t.AnyQuery, q2: t.AnyQuery): t.BoolQuery {
    const b1: t.BoolQuery = toMustQuery(q1)
    const b2: t.BoolQuery = toMustQuery(q2)
    if (!onlyShould(b1.query.bool) && !onlyShould(b2.query.bool)) {
      return deepMerge(b1, b2)
    } else {
      const { must, ...clauses } = b1.query.bool
      return Q.bool(
        must == null ? Q.must(b2) : Q.must(must, b2),
        clauses
      )
    }
  }
}

Q.or = function or (...queries: t.AnyQuery[]): t.BoolQuery {
  return Q.bool(Q.should(...queries))
}

Q.not = function not (q: t.AnyQuery): t.BoolQuery {
  if (!isBool(q) && !isClause(q)) {
    return Q.bool(Q.mustNot(q))
  }

  const b: t.BoolQuery = isClause(q)
    ? Q.bool(q as t.BoolQueryOptions)
    : q as t.BoolQuery

  if (onlyMust(b.query.bool)) {
    return Q.bool(Q.mustNot(...b.query.bool.must))
  } else if (onlyMustNot(b.query.bool)) {
    return Q.bool(Q.must(...b.query.bool.must_not))
  } else {
    return Q.bool(Q.mustNot(b))
  }
}

Q.minShouldMatch = function minShouldMatch (min: number): t.BoolQueryOptions {
  return { minimum_should_match: min }
}

Q.name = function name (queryName: string): t.BoolQueryOptions {
  return { _name: queryName }
}

Q.nested = function nested (path: string, query: any, opts: Record<string, any>): t.QueryBlock {
  return {
    query: {
      nested: {
        path,
        ...opts,
        ...query
      }
    }
  }
}

Q.constantScore = function constantScore (query: any, boost: number): t.QueryBlock {
  return {
    query: {
      constant_score: {
        ...query,
        boost
      }
    }
  }
}

Q.disMax = function disMax (queries: t.AnyQuery[], opts?: Record<string, any>): t.QueryBlock {
  return {
    query: {
      dis_max: {
        ...opts,
        queries: queries.flat()
      }
    }
  }
}

Q.functionScore = function functionScore (function_score: any): t.QueryBlock {
  return { query: { function_score } }
}

Q.boosting = function boosting (boostOpts: Record<string, any>): t.QueryBlock {
  return { query: { boosting: boostOpts } }
}

Q.sort = function sort (key: string | any[], opts?: Record<string, any>): t.Condition {
  if (Array.isArray(key) === true) {
    return { sort: key }
  }
  return {
    // @ts-ignore
    sort: [{ [key]: opts }]
  }
}

Q.size = function size (s: number): t.Condition {
  return { size: s }
}

function generateQueryObject (queryType: string, key: string, val: string, opts?: Record<string, any>): t.Condition
function generateQueryObject (queryType: string, key: string, val: string[], opts?: Record<string, any>): t.Condition[]
function generateQueryObject (queryType: string, key: string, val: any, opts?: Record<string, any>): t.Condition | t.Condition[] {
  if (Array.isArray(val)) {
    return val.map(v => generateQueryObject(queryType, key, v, opts))
  }
  if (opts === undefined) {
    return { [queryType]: { [key]: val } }
  }
  return {
    [queryType]: {
      [key]: {
        query: val,
        ...opts
      }
    }
  }
}

function generateValueObject (queryType: string, key: string, val: string, opts?: Record<string, any>): t.Condition
function generateValueObject (queryType: string, key: string, val: string[], opts?: Record<string, any>): t.Condition[]
function generateValueObject (queryType: string, key: string, val: any, opts?: Record<string, any>): t.Condition | t.Condition[] {
  if (Array.isArray(val)) {
    return val.map(v => generateValueObject(queryType, key, v, opts))
  }
  if (opts === undefined) {
    return { [queryType]: { [key]: val } }
  }
  return {
    [queryType]: {
      [key]: {
        value: val,
        ...opts
      }
    }
  }
}

function isBool (q: any): q is t.BoolQuery {
  return q.query && q.query.bool
}

function isBoolBlock (q: any): q is t.BoolBlock {
  return !!q.bool
}

function isClause (q: any): q is t.BoolQueryOptions {
  if (q.must !== undefined) return true
  if (q.should !== undefined) return true
  if (q.must_not !== undefined) return true
  if (q.filter !== undefined) return true
  if (q.minimum_should_match !== undefined) return true
  if (q._name !== undefined) return true
  return false
}

function onlyShould (bool: t.BoolQueryOptions): bool is t.ShouldClause {
  if (bool.must !== undefined) return false
  if (bool.must_not !== undefined) return false
  if (bool.filter !== undefined) return false
  if (bool.minimum_should_match !== undefined) return false
  if (bool._name !== undefined) return false
  return true
}

function onlyMust (bool: t.BoolQueryOptions): bool is t.MustClause {
  if (bool.should !== undefined) return false
  if (bool.must_not !== undefined) return false
  if (bool.filter !== undefined) return false
  if (bool.minimum_should_match !== undefined) return false
  if (bool._name !== undefined) return false
  return true
}

function onlyMustNot (bool: t.BoolQueryOptions): bool is t.MustNotClause {
  if (bool.should !== undefined) return false
  if (bool.must !== undefined) return false
  if (bool.filter !== undefined) return false
  if (bool.minimum_should_match !== undefined) return false
  if (bool._name !== undefined) return false
  return true
}

function onlyFilter (bool: t.BoolQueryOptions): bool is t.FilterClause {
  if (bool.should !== undefined) return false
  if (bool.must !== undefined) return false
  if (bool.must_not !== undefined) return false
  if (bool.minimum_should_match !== undefined) return false
  if (bool._name !== undefined) return false
  return true
}

// for a given query it always return a bool query:
//  - if is a bool query returns the query
//  - if is a clause, wraps the query in a bool block
//  - if is condition, wraps the query into a must clause and then in a bool block
function toMustQuery (query: t.AnyQuery): t.BoolQuery {
  if (isBool(query)) {
    return query
  }

  if (isClause(query)) {
    return { query: { bool: query } }
  }

  return { query: { bool: { must: [query] } } }
}

// the aim of this mergeable functions
// is to reduce the depth of the query objects
function mergeableMust (q: t.AnyQuery): t.AnyQuery | t.AnyQuery[] {
  if (Array.isArray(q)) {
    return q.map(mergeableMust)
  }
  if (isBool(q)) {
    if (onlyMust(q.query.bool)) {
      return q.query.bool.must
    } else {
      return q.query
    }
  } else if (isClause(q)) {
    if (onlyMust(q)) {
      return q.must
    } else {
      return { bool: q }
    }
  } else {
    return q
  }
}

function mergeableShould (q: t.AnyQuery): t.AnyQuery | t.AnyQuery[] {
  if (Array.isArray(q)) {
    return q.map(mergeableShould)
  }
  if (isBool(q)) {
    if (onlyShould(q.query.bool)) {
      return q.query.bool.should
    } else {
      return q.query
    }
  } else if (isClause(q)) {
    if (onlyShould(q)) {
      return q.should
    } else {
      return { bool: q }
    }
  } else {
    return q
  }
}

function mergeableMustNot (q: t.AnyQuery): t.AnyQuery | t.AnyQuery[] {
  if (Array.isArray(q)) {
    return q.map(mergeableMustNot)
  }
  if (isBool(q)) {
    if (onlyMustNot(q.query.bool)) {
      return q.query.bool.must_not
    } else {
      return q.query
    }
  } else if (isClause(q)) {
    if (onlyMustNot(q)) {
      return q.must_not
    } else {
      return { bool: q }
    }
  } else {
    return q
  }
}

function mergeableFilter (q: t.AnyQuery): t.AnyQuery | t.AnyQuery[] {
  if (Array.isArray(q)) {
    return q.map(mergeableFilter)
  }
  if (isBool(q)) {
    if (onlyFilter(q.query.bool)) {
      return q.query.bool.filter
    } else {
      return q.query
    }
  } else if (isClause(q)) {
    if (onlyFilter(q)) {
      return q.filter
    } else {
      return { bool: q }
    }
  } else {
    return q
  }
}

export default Q
