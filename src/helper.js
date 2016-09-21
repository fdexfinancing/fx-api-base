'use strict';

const https = require('https');
const async = require('async');
const fs = require('fs');
const json2csv = require('json2csv');
const _ = require('underscore');

class helper {
    capitalize(value) {
        const arrStr = value.split(" ");
        let strCap = "";

        _.each(arrStr, s => {
            strCap += `${s.charAt(0).toUpperCase()}${s.slice(1).toLowerCase()} `;
        });

        return strCap.substring(0, strCap.length - 1);
    }

    errorMessage(params) {
        const schedule = params.schedule;

        return ` - fone: (${schedule.user.phone.areaCode}) ${schedule.user.phone.number}${params.text}${schedule.user._id}<br />Cliente: ${schedule.user.name}${schedule.user.phone ? " - fone: (" + schedule.user.phone.areaCode + ") " + schedule.user.phone.number : ""}`;
    }

    removeAccent(s) {
        let r = s.toLowerCase();
        r = r.replace(new RegExp("\\s", 'g'), "");
        r = r.replace(new RegExp("[àáâãäå]", 'g'), "a");
        r = r.replace(new RegExp("æ", 'g'), "ae");
        r = r.replace(new RegExp("ç", 'g'), "c");
        r = r.replace(new RegExp("[èéêë]", 'g'), "e");
        r = r.replace(new RegExp("[ìíîï]", 'g'), "i");
        r = r.replace(new RegExp("ñ", 'g'), "n");
        r = r.replace(new RegExp("[òóôõö]", 'g'), "o");
        r = r.replace(new RegExp("œ", 'g'), "oe");
        r = r.replace(new RegExp("[ùúûü]", 'g'), "u");
        r = r.replace(new RegExp("[ýÿ]", 'g'), "y");
        r = r.replace(new RegExp("\\W", 'g'), "");
        r = r.replace('\'', "");
        r = r.replace('´', "");
        r = r.replace('`', "");
        return r;
    }

    getExtension(fileName) {
        const init = fileName.indexOf('.');
        const end = fileName.length;

        if(init && end)
            return fileName.substr(init,end);

        return '';
    }

    setFullS3Path(fileName, directory) {
        const imgPath = config.s3url + directory + fileName;
        return imgPath;
    }

    prepareDoc(cpf_cnpj) {
        cpf_cnpj = cpf_cnpj.replace(/\,/g, '');
        cpf_cnpj = cpf_cnpj.replace(/\./g, '');
        cpf_cnpj = cpf_cnpj.replace(/\-/g, '');
        cpf_cnpj = cpf_cnpj.replace(/\//g, '');
        return cpf_cnpj;
    }

    writeFile(path, file, callback) {
        fs.writeFile(path, file, function (err) {
            callback(err);
        });
    }

    removeFile(path, callback) {
        fs.unlink(path, callback);
    }

    checkCpf(strCPF) {
        let sum;
        let rest;
        sum = 0;

        if (strCPF == "00000000000" || strCPF.length < 11)
            return false;
        for (var i = 1; i <= 9; i++)
            sum = sum + parseInt(strCPF.substring(i - 1, i)) * (11 - i);

        rest = (sum * 10) % 11;
        if ((rest == 10) || (rest == 11)) rest = 0;
        if (rest != parseInt(strCPF.substring(9, 10)))
            return false;
        sum = 0;
        for (i = 1; i <= 10; i++)
            sum = sum + parseInt(strCPF.substring(i - 1, i)) * (12 - i);
        rest = (sum * 10) % 11;
        if ((rest == 10) || (rest == 11))
            rest = 0;
        if (rest != parseInt(strCPF.substring(10, 11)))
            return false;
        return true;
    }

    checkCnpj(strCnpj) {
        let numbers, digits, sum, i, result, pos, size, eq_digits;
        eq_digits = 1;
        if (strCnpj.length < 14)
            return false;
        for (i = 0; i < strCnpj.length - 1; i++)
            if (strCnpj.charAt(i) != strCnpj.charAt(i + 1)) {
                eq_digits = 0;
                break;
            }
        if (!eq_digits) {
            size = strCnpj.length - 2;
            numbers = strCnpj.substring(0, size);
            digits = strCnpj.substring(size);
            sum = 0;
            pos = size - 7;
            for (i = size; i >= 1; i--) {
                sum += numbers.charAt(size - i) * pos--;
                if (pos < 2)
                    pos = 9;
            }
            result = sum % 11 < 2 ? 0 : 11 - sum % 11;
            if (result != digits.charAt(0))
                return false;
            size = size + 1;
            numbers = strCnpj.substring(0, size);
            sum = 0;
            pos = size - 7;
            for (i = size; i >= 1; i--) {
                sum += numbers.charAt(size - i) * pos--;
                if (pos < 2)
                    pos = 9;
            }
            result = sum % 11 < 2 ? 0 : 11 - sum % 11;
            if (result != digits.charAt(1))
                return false;
            return true;
        }
        else
            return false;
    }

    formatNumber(value) {
        if (value && isNaN(value))
            return value.replace(/\./g, "").replace(",", ".");
        else
            return value;
    }

    paging(page_size, page) {
        const paging = {};

        if (page_size)
            paging.page_size = Number(page_size) || config.page_size;
        if (page)
            paging.page = Number(page);

        return paging;
    }

    generateCsv(data, fields, fieldNames, name, sendFunc, callback) {
        const self = this;
        json2csv({data, fields, fieldNames, del: ";"}, function (err, csv) {
            if (err)
                return next(err);

            const date = moment(new Date()).format("DD_MM_YYYY");
            const path = `./documents/${date}_${name}.csv`;

            async.waterfall([
                done => {
                    self.writeFile(path, csv, done);
                },
                done => {
                    const imgBuff = fs.readFileSync(path);
                    const content = imgBuff.toString('base64');

                    const attachments = [{
                        type: "text/plain",
                        name: `${date}_${name}.csv`,
                        content: content
                    }];

                    sendFunc(
                        `Planilha de ${name} da última semana.`,
                        `ETL ${name} ${date}`,
                        {attachments}, (err) => {
                            if (err)
                                console.log(err);
                        });

                    done();
                },
                done => {
                    self.removeFile(path, done);
                }
            ], callback);
        });
    }

    dynamici18nString(message){
        if(message && typeof(message) == 'string')
            return message.search(/[a-z]\.[a-z]/i) >= 0 ?  i18n.__(message) : message;

        return '';
    }
}

module.exports = new helper();
