/**
 * DocumentService — Facade
 *
 * Re-exports all domain-specific sub-modules as a single class instance
 * to preserve backward compatibility with existing controllers.
 *
 * Sub-modules:
 *   document/documentCoreService.js        — upload, get, search, stats
 *   document/documentApprovalService.js     — approve, reject, sync helpers
 *   document/documentInternshipService.js   — CS05 workflow, student overview
 *   document/documentCertificateService.js  — certificate CRUD, PDF, notifications
 *   document/documentProjectService.js      — project final document
 */

const core = require('./document/documentCoreService');
const approval = require('./document/documentApprovalService');
const internship = require('./document/documentInternshipService');
const certificate = require('./document/documentCertificateService');
const project = require('./document/documentProjectService');

class DocumentService {}

// Spread all exported functions onto the prototype so they behave like instance methods
// Non-function exports (constants) are assigned as own properties on the instance
const modules = [core, approval, internship, certificate, project];
const nonFunctionProps = {};
for (const mod of modules) {
    for (const [key, val] of Object.entries(mod)) {
        if (typeof val === 'function') {
            DocumentService.prototype[key] = val;
        } else {
            nonFunctionProps[key] = val;
        }
    }
}

const instance = new DocumentService();
Object.assign(instance, nonFunctionProps);

module.exports = instance;
