'use strict';

const expect = require('chai').expect;
const utils = require('../../src/utils');

describe('utils', () => {
    describe('getMetricNames', () => {
        it('should include project name', () => {
            const metricNames = { metric: 'metric', http_metric: 'http_metric' };
            const useUniqueHistogramName = true;
            const metricsPrefix = 'prefix';
            const projectName = 'mock_project';
            const newMetricNames = utils.getMetricNames({ metricNames, useUniqueHistogramName, metricsPrefix, projectName });
            expect(Object.values(newMetricNames)).to.have.members(['mock_project_metric', 'mock_project_http_metric']);
        });
        it('should include prefix and http prefix', () => {
            const metricNames = { metric: 'metric', http_metric: 'http_metric' };
            const useUniqueHistogramName = false;
            const metricsPrefix = 'prefix';
            const projectName = 'mock_project';
            const httpMetricsPrefix = 'http_prefix';
            const newMetricNames = utils.getMetricNames({ metricNames, useUniqueHistogramName, metricsPrefix, httpMetricsPrefix, projectName });
            expect(Object.values(newMetricNames)).to.have.members(['prefix_metric', 'http_prefix_http_metric']);
        });
    });
    describe('isArray', () => {
        it('should return true when it\'s an array', () => {
            expect(utils.isArray([])).to.equal(true);
        });
        it('should return false when it\'s not an array', () => {
            expect(utils.isArray(null)).to.equal(false);
            expect(utils.isArray(undefined)).to.equal(false);
            expect(utils.isArray('string')).to.equal(false);
            expect(utils.isArray(true)).to.equal(false);
        });
    });
    describe('isFunction', () => {
        it('should return true when it\'s a function', () => {
            expect(utils.isFunction(() => {})).to.equal(true);
        });
        it('should return false when it\'s not a function', () => {
            expect(utils.isFunction(null)).to.equal(false);
            expect(utils.isFunction(undefined)).to.equal(false);
            expect(utils.isFunction('string')).to.equal(false);
            expect(utils.isFunction(true)).to.equal(false);
            expect(utils.isFunction([])).to.equal(false);
        });
    });
    describe('isString', () => {
        it('should return true when it\'s a string', () => {
            expect(utils.isString('string')).to.equal(true);
        });
        it('should return false when it\'s not a string', () => {
            expect(utils.isString(null)).to.equal(false);
            expect(utils.isString(undefined)).to.equal(false);
            expect(utils.isString(true)).to.equal(false);
            expect(utils.isString([])).to.equal(false);
            expect(utils.isString(() => {})).to.equal(false);
        });
    });
    describe('shouldLogMetrics', () => {
        it('should return true if route is not excluded', () => {
            const excludeRoutes = ['route1', 'route2'];
            const route = 'route';
            expect(utils.shouldLogMetrics(excludeRoutes, route)).to.equal(true);
        });
        it('should return false if route is excluded', () => {
            const excludeRoutes = ['route1', 'route2'];
            const route = 'route1';
            expect(utils.shouldLogMetrics(excludeRoutes, route)).to.equal(false);
        });
    });
    describe('validateInput', () => {
        it('should return input if valid', () => {
            const value = utils.validateInput({
                input: 'string',
                isValidInputFn: utils.isString,
                defaultValue: 'default-string'
            });
            expect(value).to.equal('string');
        });
        it('should return input value if empty string', () => {
            const value = utils.validateInput({
                input: '',
                isValidInputFn: utils.isString,
                defaultValue: 'default-string'
            });
            expect(value).to.equal('');
        });
        it('should return input value if zero', () => {
            const value = utils.validateInput({
                input: 0,
                isValidInputFn: (input) => typeof input === 'number',
                defaultValue: 100
            });
            expect(value).to.equal(0);
        });
        it('should return default value if input is undefined', () => {
            const value = utils.validateInput({
                isValidInputFn: utils.isString,
                defaultValue: 'default-string'
            });
            expect(value).to.equal('default-string');
        });
        it('should throw if input is not valid', () => {
            const fn = utils.validateInput.bind(utils.validateInput, {
                input: true,
                isValidInputFn: utils.isString,
                defaultValue: 'default-string',
                errorMessage: 'error message'
            });
            expect(fn).to.throw('error message');
        });
    });
});
