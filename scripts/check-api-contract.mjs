// API contract-level invariant checks against Redocly-bundled OpenAPI JSON.
// This is not a replacement for implementation, security or cross-SDK contract tests.
import {readFile} from 'node:fs/promises';
const filename=process.argv[2];
if(!filename)throw new Error('Usage: node scripts/check-api-contract.mjs bundled-openapi.json');
const api=JSON.parse(await readFile(filename,'utf8'));
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
assert(/^3\.1\./.test(api.openapi),'OpenAPI 3.1 required');
assert(api.paths && api.components,'Missing OAS paths/components');
const resolve=p=>{
 if(!p?.$ref)return p;
 const name=p.$ref.split('/').pop();
 return api.components.parameters?.[name]??p;
};
const methods=['get','post','put','patch','delete'];
const operationIds=new Map();
let operations=0;
for(const [path,methodsObj] of Object.entries(api.paths)){
 for(const method of methods){
  const op=methodsObj[method];if(!op)continue;operations++;
  assert(op.operationId,`Missing operationId: ${method} ${path}`);
  assert(!operationIds.has(op.operationId),`Duplicate operationId ${op.operationId}: ${operationIds.get(op.operationId)} and ${path}`);
  operationIds.set(op.operationId,method.toUpperCase()+' '+path);
  assert(op.responses && Object.keys(op.responses).some(k=>/^2\d\d$/.test(k)),`Missing success response: ${method} ${path}`);
  const params=[...(methodsObj.parameters??[]),...(op.parameters??[])].map(resolve);
  for(const name of [...path.matchAll(/\{([^}]+)\}/g)].map(x=>x[1])){
    assert(params.some(p=>p.in==='path'&&p.name===name&&p.required===true),
      `Missing required path parameter ${name} for ${method} ${path}`);
  }
 }
}
const op=(route,verb)=>{const x=api.paths[route]?.[verb];assert(x,`Missing required route ${verb} ${route}`);return x};
const hasSecurity=(operation,id)=>(operation.security??[]).some(x=>Object.prototype.hasOwnProperty.call(x,id));
const protectedRoutes=[
 ['/me','get'],['/requests','post'],['/requests/{id}/accept','post'],
 ['/requests/{id}/decline','post'],['/requests/{id}/complete','post'],
 ['/me/saved-items','get'],['/me/reliability','get'],['/auth/logout','post'],
 ['/professional-profiles/{id}/company-views/{organization_id}/permissions','put']
];
for(const [route,verb] of protectedRoutes){
 const operation=op(route,verb);
 assert(hasSecurity(operation,'sessionAuth')&&hasSecurity(operation,'webSession'),
   `Protected route should accept bearer and web session: ${verb} ${route}`);
}
const guestOps=[
 ['/guest-requests','post'],['/requests/{id}','get'],['/requests/{id}/cancel','post']
];
for(const [route,verb] of guestOps){
 assert(hasSecurity(op(route,verb),'guestCapability'),`Missing scoped guest capability for ${verb} ${route}`);
}
for(const [route,verb] of [['/search','get'],['/professionals/{slug}','get'],['/organizations/{id}','get']]){
 const operation=op(route,verb);
 assert(!hasSecurity(operation,'sessionAuth')&&!hasSecurity(operation,'webSession'),
  `Public route unexpectedly requires login: ${verb} ${route}`);
}
assert(!api.paths['/bookings']&&!api.paths['/guest-inquiries'],'Legacy duplicate booking paths prohibited');
for(const id of ['getCancellationPreview','getOfferCancellationPolicy','getMyCustomerReliability',
  'createAccountAuthChallenge','verifyAccountAuthChallenge','createServiceRequest','createGuestRequest',
  'setCompanyFieldsAllowedByProfessional','setCompanyProfessionalView']){
 assert(operationIds.has(id),`Required operationId missing: ${id}`);
}
for(const id of ['webSession','sessionAuth','guestCapability']){
 assert(api.components.securitySchemes?.[id],`Missing security scheme ${id}`);
}
assert(operations>=45,`MVP API unexpectedly small (${operations})`);
console.log(`Contract invariants passed: ${Object.keys(api.paths).length} paths, ${operations} methods, ${operationIds.size} unique operation IDs.`);
