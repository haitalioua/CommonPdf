/**
 * Created by cory on 12/30/16.
 */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const uuid_1 = require("uuid");
const concat_1 = require("./concat");
const fs_1 = require("fs");
const PDFDocument = require("pdfkit");
const path_1 = require("path");
/**
 * @desc Given a position and dimensions add the provided image to the provided pdf
 *
 * @class Stamp
 * @borrows PDFDocument
 * @property {String} pdf
 * @property {String} image
 * @property {{x:Number, y:Number}} coordinates
 * @property {{width:Number, height:Number}} dimensions
 */
class Stamp {
    /**
     *
     * @param {String} pdf - pdf file path
     * @param {String} [outfile] - out put file location. Defaults to /tmp
     */
    constructor(pdf, outfile) {
        this.pdf = pdf;
        this.pdf = pdf;
        this.target = null;
        this.out = (outfile && outfile.substr(0, 4) === '/tmp') ? outfile : `/tmp/${outfile || uuid_1.v4()}.pdf`;
    }
    /**
     * @desc Generates a new pdf with image at the provided coordinates and dimensions
     * @param {String} img - data url
     * @param {{x:Number, y:Number, width:Number, height:Number}} opts -
     * @return {Promise<String>} -
     */
    _stamp(img, opts) {
        return new Promise((fulfill, reject) => {
            let out = `/tmp/${uuid_1.v4()}.pdf`, placeholderStampPdf = `/tmp/${uuid_1.v4()}.pdf`, tmpPdf = new PDFDocument();
            tmpPdf.image(img, opts.x, opts.y, { width: opts.width, height: opts.height });
            tmpPdf.pipe(fs_1.createWriteStream(out));
            tmpPdf.end();
            child_process_1.exec(`pdftk ${this.target} stamp ${out} output ${placeholderStampPdf}`, { shell: '/bin/sh' }, (error, stdout, stderr) => {
                if (error || stderr)
                    reject(error);
                else
                    fulfill(placeholderStampPdf);
            });
        });
    }
    /**
     * @desc Burst file into individual pages.
     *       Files written to /tmp with documentId prefix
     *
     * @returns {Promise}
     * @private
     *
     * @todo: The find operation will return an error for any file without x permission in /tmp directory
     *        the current work around is to ignore stderr in this process.
     *        Trying to grep filter 'Permission denied' has not yet worked.
     */
    _burst() {
        return new Promise((fulfill, reject) => {
            let documentId = path_1.basename(this.pdf, '.pdf');
            let command = `pdftk ${this.pdf} burst output /tmp/${documentId}-pg_%d.pdf && find /tmp -name "${documentId}-pg_*.pdf"`;
            child_process_1.exec(command, { shell: '/bin/sh' }, (error, stdin, stderr) => {
                fulfill(stdin.split('\n')
                    .filter(x => x.length > 0));
            });
        });
    }
    /**
     * @desc Write new pdf with image stamp.
     *
     * @param {String} img - data uri
     * @param {Number} page - page index to apply image
     * @param {{width:Number, height:Number, x:Number, y:Number}} opts - stamp positioning
     * @returns {Promise<String>} - output file location
     */
    write(img, page, opts) {
        let pages;
        return new Promise((fulfill, reject) => {
            if (!page || typeof page !== 'number')
                reject('Page number required.');
            this._burst()
                .then(burstPages => {
                pages = burstPages;
                let pageString = `pg_${page}.pdf`;
                this.target = pages.find(x => x.indexOf(pageString) !== -1);
                return Promise.resolve();
            })
                .then(() => {
                return this._stamp(img, { width: opts.width, height: opts.height, x: opts.x, y: opts.y });
            })
                .then(stampedPage => {
                return new concat_1.Concat(pages.reduce((accum, item, index) => {
                    let pageIndex = Stamp.pageIndex(item), targetIndex = Stamp.pageIndex(this.target);
                    accum[pageIndex] = pageIndex === targetIndex ? stampedPage : item;
                    return accum;
                }, []), null, null, this.out).write();
            })
                .then(final => {
                Promise.all(pages.map(p => fs_1.unlink(p, err => {
                    if (err)
                        reject(err);
                    return Promise.resolve();
                })))
                    .then(_ => {
                    fulfill(final);
                });
            })
                .catch(e => {
                reject(e);
            });
        });
    }
    static pageIndex(page) {
        let subject = page.split("_")[1];
        return parseInt(subject) - 1;
    }
}
exports.Stamp = Stamp;
//# sourceMappingURL=stamp.js.map