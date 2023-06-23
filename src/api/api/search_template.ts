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

/* eslint-disable import/export */
/* eslint-disable @typescript-eslint/no-misused-new */
/* eslint-disable @typescript-eslint/no-extraneous-class */
/* eslint-disable @typescript-eslint/no-unused-vars */

// This file was automatically generated by elastic/elastic-client-generator-js
// DO NOT MODIFY IT BY HAND. Instead, modify the source open api file,
// and elastic/elastic-client-generator-js to regenerate this file again.

import {
  Transport,
  TransportRequestOptions,
  TransportRequestOptionsWithMeta,
  TransportRequestOptionsWithOutMeta,
  TransportResult
} from '@elastic/transport'
import * as T from '../types'
import * as TB from '../typesWithBodyKey'
interface That { transport: Transport }

/**
  * Allows to use the Mustache language to pre-render a search definition.
  * @see {@link https://www.elastic.co/guide/en/elasticsearch/reference/8.9/search-template.html Elasticsearch API docs}
  */
export default async function SearchTemplateApi<TDocument = unknown> (this: That, params?: T.SearchTemplateRequest | TB.SearchTemplateRequest, options?: TransportRequestOptionsWithOutMeta): Promise<T.SearchTemplateResponse<TDocument>>
export default async function SearchTemplateApi<TDocument = unknown> (this: That, params?: T.SearchTemplateRequest | TB.SearchTemplateRequest, options?: TransportRequestOptionsWithMeta): Promise<TransportResult<T.SearchTemplateResponse<TDocument>, unknown>>
export default async function SearchTemplateApi<TDocument = unknown> (this: That, params?: T.SearchTemplateRequest | TB.SearchTemplateRequest, options?: TransportRequestOptions): Promise<T.SearchTemplateResponse<TDocument>>
export default async function SearchTemplateApi<TDocument = unknown> (this: That, params?: T.SearchTemplateRequest | TB.SearchTemplateRequest, options?: TransportRequestOptions): Promise<any> {
  const acceptedPath: string[] = ['index']
  const acceptedBody: string[] = ['explain', 'id', 'params', 'profile', 'source']
  const querystring: Record<string, any> = {}
  // @ts-expect-error
  const userBody: any = params?.body
  let body: Record<string, any> | string
  if (typeof userBody === 'string') {
    body = userBody
  } else {
    body = userBody != null ? { ...userBody } : undefined
  }

  params = params ?? {}
  for (const key in params) {
    if (acceptedBody.includes(key)) {
      body = body ?? {}
      // @ts-expect-error
      body[key] = params[key]
    } else if (acceptedPath.includes(key)) {
      continue
    } else if (key !== 'body') {
      // @ts-expect-error
      querystring[key] = params[key]
    }
  }

  let method = ''
  let path = ''
  if (params.index != null) {
    method = body != null ? 'POST' : 'GET'
    path = `/${encodeURIComponent(params.index.toString())}/_search/template`
  } else {
    method = body != null ? 'POST' : 'GET'
    path = '/_search/template'
  }
  return await this.transport.request({ path, method, querystring, body }, options)
}
