var Ze=Object.create;var le=Object.defineProperty;var et=Object.getOwnPropertyDescriptor;var tt=Object.getOwnPropertyNames;var rt=Object.getPrototypeOf,nt=Object.prototype.hasOwnProperty;var L=(e,t)=>()=>{try{return t||e((t={exports:{}}).exports,t),t.exports}catch(r){throw t=0,r}};var ot=(e,t,r,n)=>{if(t&&typeof t=="object"||typeof t=="function")for(let i of tt(t))!nt.call(e,i)&&i!==r&&le(e,i,{get:()=>t[i],enumerable:!(n=et(t,i))||n.enumerable});return e};var F=(e,t,r)=>(r=e!=null?Ze(rt(e)):{},ot(t||!e||!e.__esModule?le(r,"default",{value:e,enumerable:!0}):r,e));var de=L((ar,ue)=>{ue.exports=function(t){return t!=null&&t.constructor!=null&&typeof t.constructor.isBuffer=="function"&&t.constructor.isBuffer(t)}});var he=L((sr,pe)=>{function v(e,t){typeof t=="boolean"&&(t={forever:t}),this._originalTimeouts=JSON.parse(JSON.stringify(e)),this._timeouts=e,this._options=t||{},this._maxRetryTime=t&&t.maxRetryTime||1/0,this._fn=null,this._errors=[],this._attempts=1,this._operationTimeout=null,this._operationTimeoutCb=null,this._timeout=null,this._operationStart=null,this._timer=null,this._options.forever&&(this._cachedTimeouts=this._timeouts.slice(0))}pe.exports=v;v.prototype.reset=function(){this._attempts=1,this._timeouts=this._originalTimeouts.slice(0)};v.prototype.stop=function(){this._timeout&&clearTimeout(this._timeout),this._timer&&clearTimeout(this._timer),this._timeouts=[],this._cachedTimeouts=null};v.prototype.retry=function(e){if(this._timeout&&clearTimeout(this._timeout),!e)return!1;var t=new Date().getTime();if(e&&t-this._operationStart>=this._maxRetryTime)return this._errors.push(e),this._errors.unshift(new Error("RetryOperation timeout occurred")),!1;this._errors.push(e);var r=this._timeouts.shift();if(r===void 0)if(this._cachedTimeouts)this._errors.splice(0,this._errors.length-1),r=this._cachedTimeouts.slice(-1);else return!1;var n=this;return this._timer=setTimeout(function(){n._attempts++,n._operationTimeoutCb&&(n._timeout=setTimeout(function(){n._operationTimeoutCb(n._attempts)},n._operationTimeout),n._options.unref&&n._timeout.unref()),n._fn(n._attempts)},r),this._options.unref&&this._timer.unref(),!0};v.prototype.attempt=function(e,t){this._fn=e,t&&(t.timeout&&(this._operationTimeout=t.timeout),t.cb&&(this._operationTimeoutCb=t.cb));var r=this;this._operationTimeoutCb&&(this._timeout=setTimeout(function(){r._operationTimeoutCb()},r._operationTimeout)),this._operationStart=new Date().getTime(),this._fn(this._attempts)};v.prototype.try=function(e){console.log("Using RetryOperation.try() is deprecated"),this.attempt(e)};v.prototype.start=function(e){console.log("Using RetryOperation.start() is deprecated"),this.attempt(e)};v.prototype.start=v.prototype.try;v.prototype.errors=function(){return this._errors};v.prototype.attempts=function(){return this._attempts};v.prototype.mainError=function(){if(this._errors.length===0)return null;for(var e={},t=null,r=0,n=0;n<this._errors.length;n++){var i=this._errors[n],a=i.message,o=(e[a]||0)+1;e[a]=o,o>=r&&(t=i,r=o)}return t}});var me=L(B=>{var at=he();B.operation=function(e){var t=B.timeouts(e);return new at(t,{forever:e&&(e.forever||e.retries===1/0),unref:e&&e.unref,maxRetryTime:e&&e.maxRetryTime})};B.timeouts=function(e){if(e instanceof Array)return[].concat(e);var t={retries:10,factor:2,minTimeout:1*1e3,maxTimeout:1/0,randomize:!1};for(var r in e)t[r]=e[r];if(t.minTimeout>t.maxTimeout)throw new Error("minTimeout is greater than maxTimeout");for(var n=[],i=0;i<t.retries;i++)n.push(this.createTimeout(i,t));return e&&e.forever&&!n.length&&n.push(this.createTimeout(i,t)),n.sort(function(a,o){return a-o}),n};B.createTimeout=function(e,t){var r=t.randomize?Math.random()+1:1,n=Math.round(r*Math.max(t.minTimeout,1)*Math.pow(t.factor,e));return n=Math.min(n,t.maxTimeout),n};B.wrap=function(e,t,r){if(t instanceof Array&&(r=t,t=null),!r){r=[];for(var n in e)typeof e[n]=="function"&&r.push(n)}for(var i=0;i<r.length;i++){var a=r[i],o=e[a];e[a]=function(c){var f=B.operation(t),u=Array.prototype.slice.call(arguments,1),m=u.pop();u.push(function(p){f.retry(p)||(p&&(arguments[0]=f.mainError()),m.apply(this,arguments))}),f.attempt(function(){c.apply(e,u)})}.bind(e,o),e[a].options=t}}});var be=L((cr,we)=>{we.exports=me()});var ve=L((ur,ge)=>{var it=be();function st(e,t){function r(n,i){var a=t||{},o;"randomize"in a||(a.randomize=!0),o=it.operation(a);function s(u){i(u||new Error("Aborted"))}function c(u,m){if(u.bail){s(u);return}o.retry(u)?a.onRetry&&a.onRetry(u,m):i(o.mainError())}function f(u){var m;try{m=e(s,u)}catch(p){c(p,u);return}Promise.resolve(m).then(n).catch(function(h){c(h,u)})}o.attempt(f)}return new Promise(r)}ge.exports=st});var J=L((fr,ye)=>{function lt(e,t){if(typeof e!="function")throw new TypeError(`Expected the first argument to be a \`function\`, got \`${typeof e}\`.`);let r,n=0;return function(...a){clearTimeout(r);let o=Date.now(),s=o-n,c=t-s;c<=0?(n=o,e.apply(this,a)):r=setTimeout(()=>{n=Date.now(),e.apply(this,a)},c)}}ye.exports=lt});function ce(){if(typeof navigator<"u"&&navigator.product==="ReactNative")return!0;if(typeof process<"u"){let e=process.type;return e==="renderer"||e==="worker"?!1:!!(process.versions&&process.versions.node)}return!1}var Pe=F(de(),1);var fe={toWeb(){throw new Error("Vercel Blob: Sorry, we cannot get a Readable stream in this environment. If you see this message please open an issue here: https://github.com/vercel/storage/ with details on your environment.")}};var Me=F(ve(),1);var x=globalThis.fetch.bind(globalThis);var Fe=F(J(),1),Ke=F(J(),1),ct=new Promise(e=>{try{let t=new Uint8Array([104,101,108,108,111]);new Blob([t]).text().then(n=>{e(n==="hello")}).catch(()=>{e(!1)})}catch{e(!1)}});async function Le(e){if(e instanceof ReadableStream)return e;if(e instanceof Blob)return e.stream();if(xe(e))return fe.toWeb(e);let t;return e instanceof ArrayBuffer?t=new Uint8Array(e):dt(e)?t=e:t=ut(e),await ct?new Blob([t]).stream():new ReadableStream({start(r){r.enqueue(t),r.close()}})}function xe(e){return typeof e=="object"&&typeof e.pipe=="function"&&e.readable&&typeof e._read=="function"&&typeof e._readableState=="object"}function ut(e){return new TextEncoder().encode(e)}function dt(e){return(0,Pe.default)(e)}var ft=Symbol.for("@vercel/request-context"),pt=()=>{var e,t,r;return(r=(t=(e=globalThis[ft])==null?void 0:e.get)==null?void 0:t.call(e))!=null?r:{}};function ht(e){try{let t=process.env[e];return typeof t=="string"&&t.trim()!==""?t.trim():void 0}catch{return}}function mt(){var e;let t=(e=pt().headers)==null?void 0:e["x-vercel-oidc-token"];return typeof t=="string"&&t.trim()!==""?t.trim():ht("VERCEL_OIDC_TOKEN")}var wt=/^((-|\+)?(\d+(?:\.\d+)?)) *(kb|mb|gb|tb|pb)$/i,bt={b:1,kb:1024,mb:1<<20,gb:1<<30,tb:1024**4,pb:1024**5};function y(e){if(typeof e=="number"&&!Number.isNaN(e))return e;if(typeof e!="string")return null;let t=wt.exec(e),r,n="b";if(!t)r=parseInt(e,10);else{let[,i,,,a]=t;if(!i)return null;r=parseFloat(i),a&&(n=a.toLowerCase())}return Number.isNaN(r)?null:Math.floor(bt[n]*r)}var gt="https://vercel.com/api/blob";function _e(e){try{let t=process.env[e];return typeof t=="string"&&t.trim()!==""?t.trim():void 0}catch{return}}function Q(e){let[,,,t=""]=e.split("_");return t}function vt(e){let t=e.replace(/-/g,"+").replace(/_/g,"/"),r=4-t.length%4;if(r!==4&&(t+="=".repeat(r)),typeof atob=="function")return atob(t);if(typeof Buffer<"u")return Buffer.from(t,"base64").toString("utf8");throw new l("Cannot decode base64: no atob or Buffer available.")}function yt(e){let t=e.indexOf(".");if(t<0)throw new l("Invalid delegation token format.");let r=e.slice(0,t),n;try{n=JSON.parse(vt(r))}catch{throw new l("Invalid delegation token payload.")}if(!n.storeId||typeof n.storeId!="string")throw new l("Delegation token payload is missing `storeId`.");return Z(n.storeId)}function Z(e){return e.startsWith("store_")?e.slice(6):e}function _t(e){var t,r;if(e?.presignedUrlPayload)return{kind:"presigned",storeId:yt(e.presignedUrlPayload.delegationToken)};if(e?.token){let o=Q(e.token);return{kind:"readWrite",token:e.token,storeId:o}}let n=(t=e?.oidcToken)==null?void 0:t.trim(),i=n||mt();if(i){let o=(r=e?.storeId)==null?void 0:r.trim();if(o)return{kind:"oidc",token:i,storeId:Z(o)};let s=_e("BLOB_STORE_ID");if(s)return{kind:"oidc",token:i,storeId:Z(s)};if(n)throw new l("oidcToken was passed, but no storeId was found. Pass a `storeId` option or set `BLOB_STORE_ID` to use OIDC auth")}let a=_e("BLOB_READ_WRITE_TOKEN");if(a){let o=Q(a);return{kind:"readWrite",token:a,storeId:o}}throw new l("No blob credentials found. Pass a `token` option, set `BLOB_READ_WRITE_TOKEN`, or use `oidcToken` (or `VERCEL_OIDC_TOKEN`) with `storeId` or `BLOB_STORE_ID`.")}var l=class extends Error{constructor(e){super(`Vercel Blob: ${e}`)}};function re(e){if(typeof e!="object"||e===null)return!1;let t=Object.getPrototypeOf(e);return(t===null||t===Object.prototype||Object.getPrototypeOf(t)===null)&&!(Symbol.toStringTag in e)&&!(Symbol.iterator in e)}var Et=["//"],Oe=(()=>{if(ce())return!0;if(ee().startsWith("http://localhost"))return!1;let t=!1,r=new Request(ee(),{body:new ReadableStream,method:"POST",get duplex(){return t=!0,"half"}}).headers.has("Content-Type");return t&&!r})();function ee(e=""){let t=null;try{t=process.env.VERCEL_BLOB_API_URL||process.env.NEXT_PUBLIC_VERCEL_BLOB_API_URL}catch{}return`${t||gt}${e}`}var Ee=typeof TextEncoder=="function"?new TextEncoder:null;function q(e){return e?typeof e=="string"?Ee?Ee.encode(e).byteLength:new Blob([e]).size:"byteLength"in e&&typeof e.byteLength=="number"?e.byteLength:"size"in e&&typeof e.size=="number"?e.size:0:0}var Ut=(e,t)=>{let r=new Uint8Array(0);return new TransformStream({transform(n,i){let a=new Uint8Array(r.length+n.byteLength);for(a.set(r),a.set(new Uint8Array(n),r.length),r=a;r.length>=e;){let o=r.slice(0,e);i.enqueue(o),t?.(o.byteLength),r=r.slice(e)}},flush(n){r.length>0&&(n.enqueue(r),t?.(r.byteLength))}})};function Ie(e){return globalThis.ReadableStream&&e instanceof ReadableStream}function Ae(e){return!!(Ie(e)||xe(e))}var Tt=(e,t)=>{let r=new URL(e);for(let[n,i]of Object.entries(t.params))r.searchParams.set(n,i);return r.searchParams.set("vercel-blob-delegation",t.delegationToken),r.searchParams.set("vercel-blob-signature",t.signature),r.toString()};var Ne=!1,Ue,Te;try{((Ue=process.env.DEBUG)!=null&&Ue.includes("blob")||(Te=process.env.NEXT_PUBLIC_DEBUG)!=null&&Te.includes("blob"))&&(Ne=!0)}catch{}function g(e,...t){Ne&&console.debug(`vercel-blob: ${e}`,...t)}var ke,kt=(ke=globalThis.DOMException)!=null?ke:(()=>{try{atob("~")}catch(e){return Object.getPrototypeOf(e).constructor}})(),Rt=Object.prototype.toString,St=e=>Rt.call(e)==="[object Error]",Ct=new Set(["network error","Failed to fetch","NetworkError when attempting to fetch resource.","The Internet connection appears to be offline.","Load failed","Network request failed","fetch failed","terminated"]);function Bt(e){return e&&St(e)&&e.name==="TypeError"&&typeof e.message=="string"?e.message==="Load failed"?e.stack===void 0:Ct.has(e.message):!1}var $e=typeof x=="function",Pt=$e&&Oe,Lt=64*1024,Re=async({input:e,init:t,onUploadProgress:r})=>{g("using fetch");let n;if(t.body)if(r){let a=await Le(t.body),o=0,s=Ut(Lt,c=>{o+=c,r(o)});n=a.pipeThrough(s)}else n=t.body;let i=Oe&&n&&Ae(n)?"half":void 0;return x(e,{...t,...t.body?{body:n}:{},duplex:i})},Se=typeof XMLHttpRequest<"u",Ce=async({input:e,init:t,onUploadProgress:r})=>{g("using xhr");let n=null;return t.body&&(Ie(t.body)?n=await new Response(t.body).blob():n=t.body),new Promise((i,a)=>{let o=new XMLHttpRequest;if(o.open(t.method||"GET",e.toString(),!0),r&&o.upload.addEventListener("progress",s=>{s.lengthComputable&&r(s.loaded)}),o.onload=()=>{var s;if((s=t.signal)!=null&&s.aborted){a(new DOMException("The user aborted the request.","AbortError"));return}let c=new Headers;o.getAllResponseHeaders().trim().split(/[\r\n]+/).forEach(m=>{let p=m.split(": "),h=p.shift(),w=p.join(": ");h&&c.set(h.toLowerCase(),w)});let u=new Response(o.response,{status:o.status,statusText:o.statusText,headers:c});i(u)},o.onerror=()=>{a(new TypeError("Network request failed"))},o.ontimeout=()=>{a(new TypeError("Network request timed out"))},o.onabort=()=>{a(new DOMException("The user aborted a request.","AbortError"))},t.headers&&new Headers(t.headers).forEach((c,f)=>{o.setRequestHeader(f,c)}),t.signal&&(t.signal.addEventListener("abort",()=>{o.abort()}),t.signal.aborted)){o.abort();return}o.send(n)})},xt=async({input:e,init:t,onUploadProgress:r})=>{if(r){if(Pt)return Re({input:e,init:t,onUploadProgress:r});if(Se)return Ce({input:e,init:t,onUploadProgress:r})}if($e)return Re({input:e,init:t});if(Se)return Ce({input:e,init:t});throw new Error("No request implementation available")},Be=950,Ot=class extends l{constructor(){super("Access denied, please provide a valid token for this resource.")}},It=class extends l{constructor(e){super(e??"OIDC is enabled for this project, but not for this token's environment.")}},At=class extends l{constructor(e){super(`Content type mismatch, ${e}.`)}},Mt=class extends l{constructor(e){super(`Pathname mismatch, ${e}. Check the pathname used in upload() or put() matches the one from the client token.`)}},Nt=class extends l{constructor(){super("Client token has expired.")}},$t=class extends l{constructor(e){super(`File is too large, ${e}.`)}},Dt=class extends l{constructor(){super("This store does not exist.")}},Vt=class extends l{constructor(){super("This store has been suspended.")}},De=class extends l{constructor(){super("Unknown error, please visit https://vercel.com/help.")}},Ht=class extends l{constructor(){super("The requested blob does not exist")}},z=class extends l{constructor(){super("The blob service is currently not available. Please try again.")}},Ft=class extends l{constructor(e){super(`Too many requests please lower the number of concurrent requests ${e?` - try again in ${e} seconds`:""}.`),this.retryAfter=e??0}},qt=class extends l{constructor(){super("The request was aborted.")}},zt=class extends l{constructor(){super("Precondition failed: ETag mismatch.")}},Gt=12;function Kt(){let e=null;try{e=process.env.VERCEL_BLOB_API_VERSION_OVERRIDE||process.env.NEXT_PUBLIC_VERCEL_BLOB_API_VERSION_OVERRIDE}catch{}return`${e??Gt}`}function Wt(){try{let e=process.env.VERCEL_BLOB_RETRIES||"10";return parseInt(e,10)}catch{return 10}}function Xt(e){let t=e.headers.get("retry-after");return new Ft(t?parseInt(t,10):void 0)}async function Yt(e){var t,r,n;let i,a;try{let s=await e.json();i=(r=(t=s.error)==null?void 0:t.code)!=null?r:"unknown_error",a=(n=s.error)==null?void 0:n.message}catch{i="unknown_error"}a?.includes("contentType")&&a.includes("is not allowed")&&(i="content_type_not_allowed"),a?.includes('"pathname"')&&a.includes("does not match the token payload")&&(i="client_token_pathname_mismatch"),a==="Token expired"&&(i="client_token_expired"),a?.includes("the file length cannot be greater than")&&(i="file_too_large"),a?.startsWith("OIDC is enabled for this project, but not for the")&&a.includes("environment.")&&(i="oidc_environment_not_allowed");let o;switch(i){case"store_suspended":o=new Vt;break;case"forbidden":o=new Ot;break;case"oidc_environment_not_allowed":o=new It(a);break;case"content_type_not_allowed":o=new At(a);break;case"client_token_pathname_mismatch":o=new Mt(a);break;case"client_token_expired":o=new Nt;break;case"file_too_large":o=new $t(a);break;case"not_found":o=new Ht;break;case"client_token_not_allowed":o=new l(a??"This operation is not available when using a client token. Use a read\u2013write or OIDC token on the server.");break;case"store_not_found":o=new Dt;break;case"bad_request":o=new l(a??"Bad request");break;case"service_unavailable":o=new z;break;case"rate_limited":o=Xt(e);break;case"precondition_failed":o=new zt;break;default:o=new De;break}return{code:i,error:o}}async function G(e,t,r){let n=Kt(),i=_t(r),a=i.kind==="presigned"?void 0:i.token,o=jt(),s=ee(e);r?.presignedUrlPayload&&(s=Tt(s,r.presignedUrlPayload));let c=`${i.storeId}:${Date.now()}:${Math.random().toString(16).slice(2)}`,f=0,u=0,m=0,p=r?.onUploadProgress||Jt();t.body&&p&&(u=q(t.body)),r?.onUploadProgress&&r.onUploadProgress({loaded:0,total:u,percentage:0});let h=await(0,Me.default)(async w=>{let S;try{S=await xt({input:s,init:{...t,headers:{"x-api-blob-request-id":c,"x-vercel-blob-store-id":i.storeId,"x-api-blob-request-attempt":String(f),"x-api-version":n,...p?{"x-content-length":String(u)}:{},...a!==void 0?{authorization:`Bearer ${a}`}:{},...o,...t.headers}},onUploadProgress:r?.onUploadProgress?b=>{var T;let k=u!==0?u:b;m=b;let C=u>0?Number((b/k*100).toFixed(2)):0;C===100&&u>0||(T=r.onUploadProgress)==null||T.call(r,{loaded:b,total:k,percentage:C})}:void 0})}catch(b){if(b instanceof kt&&b.name==="AbortError"){w(new qt);return}if(Bt(b))throw b;if(b instanceof TypeError){w(b);return}throw b}if(S.ok)return S;let{code:U,error:_}=await Yt(S);if(U==="unknown_error"||U==="service_unavailable"||U==="internal_server_error")throw _;w(_)},{retries:Wt(),onRetry:w=>{w instanceof Error&&g(`retrying API request to ${e}`,w.message),f=f+1}});if(!h)throw new De;return r?.onUploadProgress&&r.onUploadProgress({loaded:m,total:m,percentage:100}),await h.json()}function jt(){let e={};try{"VERCEL_BLOB_PROXY_THROUGH_ALTERNATIVE_API"in process.env&&process.env.VERCEL_BLOB_PROXY_THROUGH_ALTERNATIVE_API!==void 0?e["x-proxy-through-alternative-api"]=process.env.VERCEL_BLOB_PROXY_THROUGH_ALTERNATIVE_API:"NEXT_PUBLIC_VERCEL_BLOB_PROXY_THROUGH_ALTERNATIVE_API"in process.env&&process.env.NEXT_PUBLIC_VERCEL_BLOB_PROXY_THROUGH_ALTERNATIVE_API!==void 0&&(e["x-proxy-through-alternative-api"]=process.env.NEXT_PUBLIC_VERCEL_BLOB_PROXY_THROUGH_ALTERNATIVE_API)}catch{}return e}function Jt(){try{return process.env.VERCEL_BLOB_USE_X_CONTENT_LENGTH==="1"}catch{return!1}}var P={cacheControlMaxAge:"x-cache-control-max-age",addRandomSuffix:"x-add-random-suffix",allowOverwrite:"x-allow-overwrite",contentType:"x-content-type",access:"x-vercel-blob-access",ifMatch:"x-if-match"};function A(e,t){let r={};if(r[P.access]=t.access,e.includes("contentType")&&t.contentType&&(r[P.contentType]=t.contentType),e.includes("addRandomSuffix")&&t.addRandomSuffix!==void 0&&(r[P.addRandomSuffix]=t.addRandomSuffix?"1":"0"),e.includes("ifMatch")&&t.ifMatch){if(t.allowOverwrite===!1)throw new l("ifMatch and allowOverwrite: false are contradictory. ifMatch is used for conditional overwrites, which requires allowOverwrite to be true.");r[P.ifMatch]=t.ifMatch,e.includes("allowOverwrite")&&t.allowOverwrite===void 0&&(r[P.allowOverwrite]="1")}return e.includes("allowOverwrite")&&t.allowOverwrite!==void 0&&(r[P.allowOverwrite]=t.allowOverwrite?"1":"0"),e.includes("cacheControlMaxAge")&&t.cacheControlMaxAge!==void 0&&(r[P.cacheControlMaxAge]=t.cacheControlMaxAge.toString()),r}async function M({pathname:e,options:t,extraChecks:r,getToken:n}){if(!e)throw new l("pathname is required");if(e.length>Be)throw new l(`pathname is too long, maximum length is ${Be}`);for(let i of Et)if(e.includes(i))throw new l(`pathname cannot contain "${i}", please encode it if needed`);if(!t)throw new l("missing options, see usage");if(t.access!=="public"&&t.access!=="private")throw new l('access must be "private" or "public", see https://vercel.com/docs/vercel-blob');return r&&r(t),n&&(t.token=await n(e,t)),t}function Ve({allowedOptions:e,getToken:t,extraChecks:r}){return async(n,i,a)=>{let o=await M({pathname:n,options:a,extraChecks:r,getToken:t}),s=A(e,o);return ne({uploadId:o.uploadId,key:o.key,pathname:n,headers:s,options:o,parts:i})}}async function ne({uploadId:e,key:t,pathname:r,parts:n,headers:i,options:a}){let o=new URLSearchParams({pathname:r});try{let s=await G(`/mpu?${o.toString()}`,{method:"POST",headers:{...i,"content-type":"application/json","x-mpu-action":"complete","x-mpu-upload-id":e,"x-mpu-key":encodeURIComponent(t)},body:JSON.stringify(n),signal:a.abortSignal},a);return g("mpu: complete",s),s}catch(s){throw s instanceof TypeError&&(s.message==="Failed to fetch"||s.message==="fetch failed")?new z:s}}function He({allowedOptions:e,getToken:t,extraChecks:r}){return async(n,i)=>{let a=await M({pathname:n,options:i,extraChecks:r,getToken:t}),o=A(e,a),s=await oe(n,o,a);return{key:s.key,uploadId:s.uploadId}}}async function oe(e,t,r){g("mpu: create","pathname:",e);let n=new URLSearchParams({pathname:e});try{let i=await G(`/mpu?${n.toString()}`,{method:"POST",headers:{...t,"x-mpu-action":"create"},signal:r.abortSignal},r);return g("mpu: create",i),i}catch(i){throw i instanceof TypeError&&(i.message==="Failed to fetch"||i.message==="fetch failed")?new z:i}}function qe({allowedOptions:e,getToken:t,extraChecks:r}){return async(n,i,a)=>{let o=await M({pathname:n,options:a,extraChecks:r,getToken:t}),s=A(e,o);if(re(i))throw new l("Body must be a string, buffer or stream. You sent a plain JavaScript object, double check what you're trying to upload.");return{etag:(await ae({uploadId:o.uploadId,key:o.key,pathname:n,part:{blob:i,partNumber:o.partNumber},headers:s,options:o})).etag,partNumber:o.partNumber}}}async function ae({uploadId:e,key:t,pathname:r,headers:n,options:i,internalAbortController:a=new AbortController,part:o}){var s,c,f;let u=new URLSearchParams({pathname:r}),m=G(`/mpu?${u.toString()}`,{signal:a.signal,method:"POST",headers:{...n,"x-mpu-action":"upload","x-mpu-key":encodeURIComponent(t),"x-mpu-upload-id":e,"x-mpu-part-number":o.partNumber.toString()},body:o.blob},i);function p(){a.abort()}(s=i.abortSignal)!=null&&s.aborted?p():(c=i.abortSignal)==null||c.addEventListener("abort",p);let h=await m;return(f=i.abortSignal)==null||f.removeEventListener("abort",p),h}var ze=typeof window<"u"?6:8,te=8*1024*1024,I=ze*te*2;function Qt({uploadId:e,key:t,pathname:r,stream:n,headers:i,options:a,totalToLoad:o}){g("mpu: upload init","key:",t);let s=new AbortController;return new Promise((c,f)=>{let u=[],m=[],p=n.getReader(),h=0,w=!1,S=1,U=!1,_=0,b=!1,T=0,k=[],C=0,Y,ie={};a.onUploadProgress&&(Y=(0,Fe.default)(()=>{var d;let E=Object.values(ie).reduce((V,H)=>V+H,0),R=o||E,O=o>0?Number(((E/o||E)*100).toFixed(2)):0;(d=a.onUploadProgress)==null||d.call(a,{loaded:E,total:R,percentage:O})},150)),se().catch(D);async function se(){for(g("mpu: upload read start","activeUploads:",h,"currentBytesInMemory:",`${y(_)}/${y(I)}`,"bytesSent:",y(T)),w=!0;_<I&&!U;)try{let{value:d,done:E}=await p.read();if(E){b=!0,g("mpu: upload read consumed the whole stream"),k.length>0?(u.push({partNumber:S++,blob:new Blob(k,{type:"application/octet-stream"})}),j()):h===0&&(p.releaseLock(),c(m)),w=!1;return}_+=d.byteLength;let R=0;for(;R<d.byteLength;){let O=te-C,V=Math.min(R+O,d.byteLength),H=d.slice(R,V);k.push(H),C+=H.byteLength,R=V,C===te&&(u.push({partNumber:S++,blob:new Blob(k,{type:"application/octet-stream"})}),k=[],C=0,j())}}catch(d){D(d)}g("mpu: upload read end","activeUploads:",h,"currentBytesInMemory:",`${y(_)}/${y(I)}`,"bytesSent:",y(T)),w=!1}async function Qe(d){h++,g("mpu: upload send part start","partNumber:",d.partNumber,"size:",d.blob.size,"activeUploads:",h,"currentBytesInMemory:",`${y(_)}/${y(I)}`,"bytesSent:",y(T));try{let E=a.onUploadProgress?O=>{ie[d.partNumber]=O.loaded,Y&&Y()}:void 0,R=await ae({uploadId:e,key:t,pathname:r,headers:i,options:{...a,onUploadProgress:E},internalAbortController:s,part:d});if(g("mpu: upload send part end","partNumber:",d.partNumber,"activeUploads",h,"currentBytesInMemory:",`${y(_)}/${y(I)}`,"bytesSent:",y(T)),U)return;if(m.push({partNumber:d.partNumber,etag:R.etag}),_-=d.blob.size,h--,T+=d.blob.size,u.length>0&&j(),b){h===0&&(p.releaseLock(),c(m));return}w||se().catch(D)}catch(E){D(E)}}function j(){if(!U)for(g("send parts","activeUploads",h,"partsToUpload",u.length);h<ze&&u.length>0;){let d=u.shift();d&&Qe(d)}}function D(d){U||(U=!0,s.abort(),p.releaseLock(),d instanceof TypeError&&(d.message==="Failed to fetch"||d.message==="fetch failed")?f(new z):f(d))}})}function Ge({allowedOptions:e,getToken:t,extraChecks:r}){return async(n,i)=>{let a=await M({pathname:n,options:i,extraChecks:r,getToken:t}),o=A(e,a),s=await oe(n,o,a);return{key:s.key,uploadId:s.uploadId,async uploadPart(c,f){if(re(f))throw new l("Body must be a string, buffer or stream. You sent a plain JavaScript object, double check what you're trying to upload.");return{etag:(await ae({uploadId:s.uploadId,key:s.key,pathname:n,part:{partNumber:c,blob:f},headers:o,options:a})).etag,partNumber:c}},async complete(c){return ne({uploadId:s.uploadId,key:s.key,pathname:n,parts:c,headers:o,options:a})}}}}async function Zt(e,t,r,n){g("mpu: init","pathname:",e,"headers:",r);let i={...n,onUploadProgress:void 0};if(n.maximumSizeInBytes!==void 0&&!Ae(t)&&q(t)>n.maximumSizeInBytes)throw new l(`Body size of ${q(t)} bytes exceeds the maximum allowed size of ${n.maximumSizeInBytes} bytes`);let a=await oe(e,r,i),o=q(t),s=await Le(t),c=await Qt({uploadId:a.uploadId,key:a.key,pathname:e,stream:s,headers:r,options:n,totalToLoad:o});return await ne({uploadId:a.uploadId,key:a.key,pathname:e,parts:c,headers:r,options:i})}function K({allowedOptions:e,getToken:t,getPresignedUrlPayload:r,extraChecks:n}){return async function(a,o,s){if(!o)throw new l("body is required");if(re(o))throw new l("Body must be a string, buffer or stream. You sent a plain JavaScript object, double check what you're trying to upload.");let c=await M({pathname:a,options:s,extraChecks:n,getToken:t}),f=await r?.(a,c),u={...c,presignedUrlPayload:f},m=A(e,c);if(c.multipart===!0)return Zt(a,o,m,u);let p=c.onUploadProgress?(0,Ke.default)(c.onUploadProgress,100):void 0,h=new URLSearchParams({pathname:a}),w=await G(`/?${h.toString()}`,{method:"PUT",body:o,headers:m,signal:c.abortSignal},{...u,onUploadProgress:p});return{url:w.url,downloadUrl:w.downloadUrl,pathname:w.pathname,contentType:w.contentType,contentDisposition:w.contentDisposition,etag:w.etag}}}var wr=365*24*60*60;var br=new TextEncoder;function N(e){return function(r){if(!r.token.startsWith("vercel_blob_client_"))throw new l(`${e} must be called with a client token`);if(r.addRandomSuffix!==void 0||r.allowOverwrite!==void 0||r.cacheControlMaxAge!==void 0)throw new l(`${e} doesn't allow \`addRandomSuffix\`, \`cacheControlMaxAge\` or \`allowOverwrite\`. Configure these options at the server side when generating client tokens.`)}}var Dr=K({allowedOptions:["contentType"],extraChecks:N("client/`put`")}),Vr=He({allowedOptions:["contentType"],extraChecks:N("client/`createMultipartUpload`")}),Hr=Ge({allowedOptions:["contentType"],extraChecks:N("client/`createMultipartUpload`")}),Fr=qe({allowedOptions:["contentType"],extraChecks:N("client/`multipartUpload`")}),qr=Ve({allowedOptions:["contentType"],extraChecks:N("client/`completeMultipartUpload`")}),We=K({allowedOptions:["contentType"],extraChecks(e){if(e.handleUploadUrl===void 0)throw new l("client/`upload` requires the 'handleUploadUrl' parameter");if(e.addRandomSuffix!==void 0||e.allowOverwrite!==void 0||e.cacheControlMaxAge!==void 0||e.ifMatch!==void 0)throw new l("client/`upload` doesn't allow `addRandomSuffix`, `cacheControlMaxAge`, `allowOverwrite` or `ifMatch`. Configure these options at the server side when generating client tokens.")},async getToken(e,t){var r,n;return er({handleUploadUrl:t.handleUploadUrl,pathname:e,clientPayload:(r=t.clientPayload)!=null?r:null,multipart:(n=t.multipart)!=null?n:!1,headers:t.headers})}}),zr=K({allowedOptions:["contentType"],extraChecks(e){if(e.handleUploadUrl===void 0)throw new l("client/`upload` requires the 'handleUploadUrl' parameter");if(e.addRandomSuffix!==void 0||e.allowOverwrite!==void 0||e.cacheControlMaxAge!==void 0||e.ifMatch!==void 0)throw new l("client/`uploadPresigned` doesn't allow `addRandomSuffix`, `cacheControlMaxAge`, `allowOverwrite` or `ifMatch`. Configure these options at the server side when generating presigned URLs.")},async getPresignedUrlPayload(e,t){var r,n;return tr({pathname:e,handleUploadUrl:t.handleUploadUrl,clientPayload:(r=t.clientPayload)!=null?r:null,multipart:(n=t.multipart)!=null?n:!1,headers:t.headers})}});var Xe={generateClientToken:"blob.generate-client-token",generatePresignedUrl:"blob.generate-presigned-url",uploadCompleted:"blob.upload-completed"};async function er(e){let{handleUploadUrl:t,pathname:r}=e,n=je(t)?t:Ye(t),i={type:Xe.generateClientToken,payload:{pathname:r,clientPayload:e.clientPayload,multipart:e.multipart}},a=await x(n,{method:"POST",body:JSON.stringify(i),headers:{"content-type":"application/json",...e.headers},signal:e.abortSignal});if(!a.ok)throw new l("Failed to  retrieve the client token");try{let{clientToken:o}=await a.json();return o}catch{throw new l("Failed to retrieve the client token")}}async function tr(e){let{handleUploadUrl:t,pathname:r}=e,n=je(t)?t:Ye(t),i={type:Xe.generatePresignedUrl,payload:{pathname:r,clientPayload:e.clientPayload,multipart:e.multipart}},a=await x(n,{method:"POST",body:JSON.stringify(i),headers:{"content-type":"application/json",...e.headers},signal:e.abortSignal});if(!a.ok)throw new l("Failed to retrieve the presigned URL");try{let{presignedUrlPayload:o}=await a.json();if(o)return o;throw new l("Missing presignedUrlPayload")}catch(o){throw o instanceof l?o:new l("Failed to retrieve the presigned URL")}}function Ye(e){return new URL(e,location.href).href}function je(e){try{return!!new URL(e)}catch{return!1}}var W=document.querySelector("[data-publish-form]"),Je=document.querySelector("[data-submit]"),$=document.querySelector("[data-status]"),X=document.querySelector("[data-progress]");W.addEventListener("submit",async e=>{e.preventDefault();let t=new FormData(W),r=t.get("video");if(!(!(r instanceof File)||!r.size)){Je.disabled=!0,X.hidden=!1,X.value=0,$.textContent="\u041F\u0440\u043E\u0432\u0435\u0440\u044F\u0435\u043C \u0432\u0438\u0434\u0435\u043E\u2026";try{await rr(r);let n=crypto.randomUUID(),i=r.name.replace(/[^a-zA-Z0-9._-]+/g,"-").slice(-100);$.textContent="\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0432\u0438\u0434\u0435\u043E\u2026",await We(`shorts/videos/${n}-${i}`,r,{access:"public",multipart:!0,handleUploadUrl:"/api/shorts-upload",clientPayload:JSON.stringify({id:n,password:String(t.get("password")||"").trim(),title:t.get("title"),caption:t.get("caption")}),onUploadProgress:({percentage:o})=>{X.value=o,$.textContent=`\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430: ${Math.round(o)}%`}}),$.textContent="\u0413\u043E\u0442\u043E\u0432\u043E. \u0420\u043E\u043B\u0438\u043A \u043E\u043F\u0443\u0431\u043B\u0438\u043A\u043E\u0432\u0430\u043D.";let a=String(t.get("password")||"").trim();W.reset(),W.elements.password.value=a,X.value=100}catch(n){$.textContent=n.message||"\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u043F\u0443\u0431\u043B\u0438\u043A\u043E\u0432\u0430\u0442\u044C \u0440\u043E\u043B\u0438\u043A"}finally{Je.disabled=!1}}});function rr(e){return e.size>500*1024*1024?Promise.reject(new Error("\u0412\u0438\u0434\u0435\u043E \u043F\u0440\u0435\u0432\u044B\u0448\u0430\u0435\u0442 \u043B\u0438\u043C\u0438\u0442 500 \u041C\u0411")):new Promise((t,r)=>{let n=document.createElement("video"),i=URL.createObjectURL(e);n.preload="metadata",n.onloadedmetadata=()=>{URL.revokeObjectURL(i),n.videoHeight<=n.videoWidth?r(new Error("\u0414\u043B\u044F shorts \u043D\u0443\u0436\u043D\u043E \u0432\u0435\u0440\u0442\u0438\u043A\u0430\u043B\u044C\u043D\u043E\u0435 \u0432\u0438\u0434\u0435\u043E")):n.duration>180?r(new Error("Short \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C \u043D\u0435 \u0434\u043B\u0438\u043D\u043D\u0435\u0435 3 \u043C\u0438\u043D\u0443\u0442")):t()},n.onerror=()=>{URL.revokeObjectURL(i),r(new Error("\u0411\u0440\u0430\u0443\u0437\u0435\u0440 \u043D\u0435 \u0441\u043C\u043E\u0433 \u043F\u0440\u043E\u0447\u0438\u0442\u0430\u0442\u044C \u0432\u0438\u0434\u0435\u043E"))},n.src=i})}
/*! Bundled license information:

is-buffer/index.js:
  (*!
   * Determine if an object is a Buffer
   *
   * @author   Feross Aboukhadijeh <https://feross.org>
   * @license  MIT
   *)

@vercel/blob/dist/chunk-3D2SZ6M2.js:
  (*!
   * bytes
   * Copyright(c) 2012-2014 TJ Holowaychuk
   * Copyright(c) 2015 Jed Watson
   * MIT Licensed
   *)
*/
;(() => {
  const form = document.querySelector('[data-publish-form]');
  const refreshButton = document.querySelector('[data-admin-refresh]');
  const searchInput = document.querySelector('[data-admin-search]');
  const filterStatus = document.querySelector('[data-filter-status]');
  const filterSort = document.querySelector('[data-filter-sort]');
  const adminStatus = document.querySelector('[data-admin-status]');
  const statsRoot = document.querySelector('[data-admin-stats]');
  const chartRoot = document.querySelector('[data-dashboard-chart]');
  const healthRoot = document.querySelector('[data-dashboard-health]');
  const insightsRoot = document.querySelector('[data-dashboard-insights]');
  const activityRoot = document.querySelector('[data-dashboard-activity]');
  const bulkToolbar = document.querySelector('[data-bulk-toolbar]');
  const selectionCount = document.querySelector('[data-selection-count]');
  const listRoot = document.querySelector('[data-admin-list]');
  const uploadStatus = document.querySelector('[data-status]');

  if (
    !form || !refreshButton || !searchInput || !filterStatus || !filterSort ||
    !adminStatus || !statsRoot || !chartRoot || !healthRoot ||
    !insightsRoot || !activityRoot || !bulkToolbar || !selectionCount || !listRoot
  ) return;

  const state = {
    items: [],
    dashboard: null,
    selectedIds: new Set()
  };

  refreshButton.addEventListener('click', () => {
    loadAdminPanel().catch((error) => {
      adminStatus.textContent = error.message || 'Не удалось загрузить дашборд';
    });
  });
  searchInput.addEventListener('input', renderAdminList);
  filterStatus.addEventListener('change', renderAdminList);
  filterSort.addEventListener('change', renderAdminList);
  listRoot.addEventListener('click', (event) => {
    handleAdminAction(event).catch((error) => {
      adminStatus.textContent = error.message || 'Не удалось выполнить действие';
    });
  });
  listRoot.addEventListener('change', handleListChange);
  bulkToolbar.addEventListener('click', (event) => {
    handleBulkToolbarClick(event).catch((error) => {
      adminStatus.textContent = error.message || 'Не удалось выполнить массовое действие';
    });
  });

  if (uploadStatus) {
    new MutationObserver(() => {
      if (uploadStatus.textContent && uploadStatus.textContent.includes('Ролик опубликован')) {
        loadAdminPanel().catch(() => {});
      }
    }).observe(uploadStatus, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  async function loadAdminPanel() {
    const password = getPassword();
    if (!password) {
      adminStatus.textContent = 'Сначала введи пароль администратора.';
      return;
    }

    refreshButton.disabled = true;
    adminStatus.textContent = 'Загружаю дашборд и список роликов...';

    try {
      const response = await fetch('/api/shorts-admin', {
        headers: { 'x-admin-password': password },
        cache: 'no-store'
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Не удалось загрузить админку');

      state.items = Array.isArray(payload.items) ? payload.items : [];
      state.dashboard = payload.dashboard || null;
      cleanupSelection();
      renderStats(payload.stats || {});
      renderDashboard(payload.dashboard || null);
      renderAdminList();
      adminStatus.textContent = `Готово. Найдено роликов: ${state.items.length}.`;
    } catch (error) {
      adminStatus.textContent = error.message || 'Не удалось загрузить список';
      statsRoot.innerHTML = '';
      chartRoot.innerHTML = '';
      healthRoot.innerHTML = '';
      insightsRoot.innerHTML = '';
      activityRoot.innerHTML = '';
      listRoot.innerHTML = '';
      syncBulkToolbar();
    } finally {
      refreshButton.disabled = false;
    }
  }

  async function handleAdminAction(event) {
    const trigger = event.target.closest('[data-action]');
    if (!trigger) return;

    const card = trigger.closest('[data-short-id]');
    if (!card) return;

    const id = card.dataset.shortId;
    const password = getPassword();
    if (!password) {
      adminStatus.textContent = 'Нужен пароль администратора.';
      return;
    }

    if (trigger.dataset.action === 'delete' && !window.confirm('Удалить ролик без возврата?')) {
      return;
    }

    setCardStatus(card, trigger.dataset.action === 'delete' ? 'Удаляю ролик...' : 'Сохраняю...');
    disableCard(card, true);

    try {
      if (trigger.dataset.action === 'delete') {
        const response = await fetch('/api/shorts-admin', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, password })
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Не удалось удалить ролик');

        state.selectedIds.delete(id);
        await loadAdminPanel();
        adminStatus.textContent = 'Ролик удалён.';
        return;
      }

      const title = card.querySelector('[data-field="title"]').value;
      const caption = card.querySelector('[data-field="caption"]').value;
      const nextStatus = trigger.dataset.action === 'toggle'
        ? trigger.dataset.nextStatus
        : card.querySelector('[data-field="status"]').value;

      const response = await fetch('/api/shorts-admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, password, title, caption, status: nextStatus })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Не удалось сохранить ролик');

      await loadAdminPanel();
      adminStatus.textContent = 'Изменения сохранены.';
    } catch (error) {
      setCardStatus(card, error.message || 'Не удалось выполнить действие');
      disableCard(card, false);
    }
  }

  function handleListChange(event) {
    const checkbox = event.target.closest('[data-select-short]');
    if (!checkbox) return;

    if (checkbox.checked) {
      state.selectedIds.add(checkbox.value);
    } else {
      state.selectedIds.delete(checkbox.value);
    }

    syncBulkToolbar();
    const card = checkbox.closest('[data-short-id]');
    if (card) {
      card.classList.toggle('is-selected', checkbox.checked);
    }
  }

  async function handleBulkToolbarClick(event) {
    const selectTrigger = event.target.closest('[data-bulk-select]');
    if (selectTrigger) {
      if (selectTrigger.dataset.bulkSelect === 'visible') {
        getVisibleItems().forEach((item) => state.selectedIds.add(item.id));
      } else {
        state.selectedIds.clear();
      }
      renderAdminList();
      return;
    }

    const actionTrigger = event.target.closest('[data-bulk-action]');
    if (!actionTrigger) return;

    const password = getPassword();
    if (!password) {
      adminStatus.textContent = 'Нужен пароль администратора.';
      return;
    }

    const ids = [...state.selectedIds];
    if (!ids.length) {
      adminStatus.textContent = 'Сначала выбери ролики.';
      return;
    }

    const action = actionTrigger.dataset.bulkAction;
    if (action === 'delete' && !window.confirm(`Удалить выбранные ролики: ${ids.length} шт.?`)) {
      return;
    }

    setBulkDisabled(true);
    adminStatus.textContent = getBulkPendingMessage(action, ids.length);

    try {
      const response = await fetch('/api/shorts-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ids, password })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Не удалось выполнить массовое действие');

      state.selectedIds.clear();
      await loadAdminPanel();
      adminStatus.textContent = getBulkSuccessMessage(action, payload.processed || 0);
    } finally {
      setBulkDisabled(false);
    }
  }

  function renderStats(stats) {
    const safeStats = {
      total: Number(stats.total || 0),
      published: Number(stats.published || 0),
      hidden: Number(stats.hidden || 0),
      publicationRate: safePercent(stats.total ? (stats.published / stats.total) * 100 : 0),
      videoViews: Number(stats.videoViews || 0)
    };

    statsRoot.innerHTML = `
      <article class="admin-stat">
        <strong>${safeStats.total}</strong>
        <span>Всего роликов</span>
        <small>Вся база шортсов</small>
      </article>
      <article class="admin-stat">
        <strong>${safeStats.published}</strong>
        <span>В ленте</span>
        <small>${safeStats.publicationRate}% от всего контента</small>
      </article>
      <article class="admin-stat">
        <strong>${safeStats.hidden}</strong>
        <span>Скрыто</span>
        <small>Не видно пользователю</small>
      </article>
      <article class="admin-stat">
        <strong>${safeStats.videoViews}</strong>
        <span>Просмотры видео</span>
        <small>Запуски shorts</small>
      </article>
    `;
  }

  function renderDashboard(dashboard) {
    if (!dashboard) {
      chartRoot.innerHTML = '';
      healthRoot.innerHTML = '';
      insightsRoot.innerHTML = '';
      activityRoot.innerHTML = '';
      return;
    }

    const timeline = Array.isArray(dashboard.timeline) ? dashboard.timeline : [];
    const maxCount = Math.max(...timeline.map((item) => item.count), 1);

    chartRoot.innerHTML = timeline.map((item) => {
      const height = Math.max(8, Math.round(item.count / maxCount * 160));
      return `
        <article class="chart-day" aria-label="${escapeAttribute(item.fullLabel)}: ${item.count}">
          <div class="chart-value">${item.count}</div>
          <div class="chart-bar-wrap">
            <div class="chart-bar" style="height:${height}px"></div>
          </div>
          <div class="chart-label">${escapeHtml(item.shortLabel)}</div>
        </article>
      `;
    }).join('');

    const kpis = dashboard.kpis || {};
    const ratios = dashboard.ratios || {};

    healthRoot.innerHTML = `
      ${renderMeterCard('Покрытие ленты', 'Доля роликов, которые сейчас видны в shorts', safePercent(ratios.publicationRate), 'success')}
      ${renderMeterCard('Карточки с подписью', 'Насколько лента заполнена описаниями', safePercent(ratios.captionCoverage), ratios.captionCoverage >= 70 ? 'success' : 'danger')}
    `;

    insightsRoot.innerHTML = `
      ${renderInsightCard('Новых за 7 дней', `${Number(kpis.recentPublished || 0)}`, 'Сколько роликов вышло за последнюю неделю')}
      ${renderInsightCard('Обновлений за 7 дней', `${Number(kpis.recentUpdated || 0)}`, 'Сколько карточек правилось за последнюю неделю')}
      ${renderInsightCard('Без подписи', `${Number(kpis.withoutCaption || 0)}`, 'Ролики, у которых пустое описание')}
      ${renderInsightCard('Средняя длина заголовка', `${Number(kpis.averageTitleLength || 0)} симв.`, 'Показывает плотность названий')}
      ${renderInsightCard('Средняя длина подписи', `${Number(kpis.averageCaptionLength || 0)} симв.`, 'Показывает, насколько заполняется описание')}
      ${renderInsightCard('Активных дней', `${Number(kpis.activeDays || 0)}`, 'Сколько дней живёт текущая база shorts')}
    `;

    const activity = Array.isArray(dashboard.activity) ? dashboard.activity : [];
    activityRoot.innerHTML = activity.length
      ? activity.map((item) => `
          <article class="activity-item">
            <strong>${escapeHtml(item.title)}</strong>
            <div class="activity-meta">
              <span>${item.action === 'updated' ? 'Обновлён' : 'Опубликован'} ${escapeHtml(formatDate(item.at))}</span>
              <span class="activity-status" data-status="${escapeAttribute(item.status)}">
                ${item.status === 'published' ? 'В ленте' : 'Скрыт'}
              </span>
            </div>
          </article>
        `).join('')
      : '<div class="admin-empty">Активности пока нет.</div>';
  }

  function renderMeterCard(title, description, percent, tone) {
    return `
      <article class="meter-card">
        <strong>${escapeHtml(title)}</strong>
        <div class="meter-copy">
          <span>${escapeHtml(description)}</span>
          <span>${percent}%</span>
        </div>
        <div class="meter-track" aria-hidden="true">
          <div class="meter-fill" data-tone="${escapeAttribute(tone)}" style="width:${percent}%"></div>
        </div>
      </article>
    `;
  }

  function renderInsightCard(title, value, description) {
    return `
      <article class="insight-card">
        <strong>${escapeHtml(title)}</strong>
        <div class="insight-copy">
          <span>${escapeHtml(description)}</span>
          <span>${escapeHtml(value)}</span>
        </div>
      </article>
    `;
  }

  function renderAdminList() {
    const items = getVisibleItems();

    syncBulkToolbar();

    if (!items.length) {
      listRoot.innerHTML = `<div class="admin-empty">${searchInput.value || filterStatus.value !== 'all' ? 'По текущему фильтру ничего нет.' : 'Роликов пока нет.'}</div>`;
      return;
    }

    listRoot.innerHTML = items.map((item) => {
      const nextStatus = item.status === 'published' ? 'hidden' : 'published';
      const toggleLabel = nextStatus === 'hidden' ? 'Скрыть из ленты' : 'Вернуть в ленту';
      const isSelected = state.selectedIds.has(item.id);

      return `
        <article class="short-admin-card${isSelected ? ' is-selected' : ''}" data-short-id="${escapeAttribute(item.id)}">
          <div class="short-admin-side">
            <label class="short-admin-select">
              <input type="checkbox" data-select-short value="${escapeAttribute(item.id)}"${isSelected ? ' checked' : ''}>
              <span>Выбрать ролик</span>
            </label>
            <video class="short-admin-preview" src="${escapeAttribute(item.videoUrl)}" controls preload="metadata" muted playsinline></video>
          </div>
          <div class="short-admin-main">
            <div class="short-admin-meta">
              <span class="short-admin-badge" data-status="${escapeAttribute(item.status)}">${item.status === 'published' ? 'Опубликован' : 'Скрыт'}</span>
              <span class="short-admin-views">${Number(item.views || 0).toLocaleString('ru-RU')} просмотров${item.lastViewedAt ? ` · Последний: ${escapeHtml(formatDate(item.lastViewedAt))}` : ''}</span>
              <span class="short-admin-dates">Опубликован: ${escapeHtml(formatDate(item.publishedAt))}</span>
              <span class="short-admin-dates">Обновлён: ${escapeHtml(formatDate(item.updatedAt))}</span>
            </div>
            <div class="short-admin-id">ID: ${escapeHtml(item.id)}</div>
            <label class="field">Название
              <input data-field="title" maxlength="120" value="${escapeAttribute(item.title)}">
            </label>
            <label class="field">Подпись
              <textarea data-field="caption" maxlength="500">${escapeHtml(item.caption || '')}</textarea>
            </label>
            <label class="field">Статус
              <select data-field="status">
                <option value="published"${item.status === 'published' ? ' selected' : ''}>В ленте</option>
                <option value="hidden"${item.status === 'hidden' ? ' selected' : ''}>Скрыт</option>
              </select>
            </label>
            <div class="short-admin-actions">
              <button class="short-admin-action" type="button" data-action="save">Сохранить</button>
              <button class="ghost-button" type="button" data-action="toggle" data-next-status="${escapeAttribute(nextStatus)}">${toggleLabel}</button>
              <a class="short-admin-action" href="${escapeAttribute(item.videoUrl)}" target="_blank" rel="noopener">Открыть видео</a>
              <button class="danger-button" type="button" data-action="delete">Удалить</button>
            </div>
            <p class="short-admin-inline-status" data-inline-status></p>
          </div>
        </article>
      `;
    }).join('');
  }

  function getVisibleItems() {
    const query = String(searchInput.value || '').trim().toLowerCase();
    const statusValue = filterStatus.value;
    const sortValue = filterSort.value;

    const items = state.items.filter((item) => {
      const matchesStatus = statusValue === 'all' ? true : item.status === statusValue;
      const matchesSearch = query ? `${item.title} ${item.caption || ''}`.toLowerCase().includes(query) : true;
      return matchesStatus && matchesSearch;
    });

    return items.sort((left, right) => {
      if (sortValue === 'oldest') {
        return new Date(left.publishedAt).getTime() - new Date(right.publishedAt).getTime();
      }
      if (sortValue === 'updated') {
        return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
      }
      if (sortValue === 'title') {
        return left.title.localeCompare(right.title, 'ru');
      }
      return new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime();
    });
  }

  function syncBulkToolbar() {
    cleanupSelection();
    selectionCount.textContent = `Выбрано: ${state.selectedIds.size}`;
    bulkToolbar.hidden = state.items.length === 0;
  }

  function cleanupSelection() {
    const available = new Set(state.items.map((item) => item.id));
    state.selectedIds.forEach((id) => {
      if (!available.has(id)) state.selectedIds.delete(id);
    });
  }

  function setBulkDisabled(disabled) {
    bulkToolbar.querySelectorAll('button').forEach((button) => {
      button.disabled = disabled;
    });
  }

  function getBulkPendingMessage(action, count) {
    if (action === 'delete') return `Удаляю ролики: ${count} шт...`;
    if (action === 'hide') return `Скрываю ролики: ${count} шт...`;
    return `Возвращаю в ленту ролики: ${count} шт...`;
  }

  function getBulkSuccessMessage(action, count) {
    if (action === 'delete') return `Удалено роликов: ${count}.`;
    if (action === 'hide') return `Скрыто роликов: ${count}.`;
    return `Возвращено в ленту роликов: ${count}.`;
  }

  function getPassword() {
    return String(form.elements.password.value || '').trim();
  }

  function setCardStatus(card, message) {
    const node = card.querySelector('[data-inline-status]');
    if (node) node.textContent = message;
  }

  function disableCard(card, disabled) {
    card.querySelectorAll('button, input, textarea, select').forEach((element) => {
      element.disabled = disabled;
    });
  }

  function formatDate(value) {
    return new Intl.DateTimeFormat('ru-RU', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(value));
  }

  function safePercent(value) {
    return Math.max(0, Math.min(100, Math.round(Number(value || 0))));
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (mark) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[mark]));
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replace(/`/g, '&#96;');
  }
})();
