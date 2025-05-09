'use client';

import Component from '@glimmer/component';
import React from 'react';
import countries from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';
import {BarList, useQuery} from '@tinybirdco/charts';
import {action} from '@ember/object';
import {barListColor, getCountryFlag, getEndpointUrl, getStatsParams, getToken} from 'ghost-admin/utils/stats';
import {formatNumber} from 'ghost-admin/helpers/format-number';
import {inject} from 'ghost-admin/decorators/inject';
import {inject as service} from '@ember/service';

countries.registerLocale(enLocale);

export default class AllStatsModal extends Component {
    @inject config;
    @service router;
    @service modals;

    get type() {
        return this.args.data.type;
    }

    get chartRange() {
        return this.args.data.chartRange;
    }

    get audience() {
        return this.args.data.audience;
    }

    get modalTitle() {
        switch (this.type) {
        case 'top-sources':
            return 'Sources';
        case 'top-locations':
            return 'Locations';
        default:
            return 'Content';
        }
    }

    @action
    navigateToFilter(label) {
        const params = {};
        if (this.type === 'top-sources') {
            params.source = label || 'direct';
        } else if (this.type === 'top-locations') {
            params.location = label || 'unknown';
        } else if (this.type === 'top-pages') {
            params.pathname = label;
        }

        this.args.close();
        this.updateQueryParams(params);
    }

    updateQueryParams(params) {
        const currentRoute = this.router.currentRoute;
        const newQueryParams = {...currentRoute.queryParams, ...params};

        this.router.transitionTo({queryParams: newQueryParams});
    }

    getCountryName = (label) => {
        return countries.getName(label, 'en') || 'Unknown';
    };

    ReactComponent = (props) => {
        const {type} = props;

        const params = getStatsParams(
            this.config,
            props
        );

        let endpoint;
        let labelText;
        let indexBy;
        let unknownOption = 'Unknown';
        switch (type) {
        case 'top-sources':
            endpoint = getEndpointUrl(this.config, 'api_top_sources');
            labelText = 'Source';
            indexBy = 'source';
            unknownOption = 'Direct';
            break;
        case 'top-locations':
            endpoint = getEndpointUrl(this.config, 'api_top_locations');
            labelText = 'Country';
            indexBy = 'location';
            unknownOption = 'Unknown';
            break;
        default:
            endpoint = getEndpointUrl(this.config, 'api_top_pages');
            labelText = 'Post or page';
            indexBy = 'pathname';
            break;
        }

        const {data, meta, error, loading} = useQuery({
            endpoint: endpoint,
            token: getToken(this.config),
            params
        });

        return (
            <BarList
                data={data}
                meta={meta}
                error={error}
                loading={loading}
                index={indexBy}
                indexConfig={{
                    label: <span className="gh-stats-data-header">{labelText}</span>,
                    renderBarContent: ({label}) => (
                        <span className='gh-stats-data-label'>
                            <a
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    this.navigateToFilter(label);
                                }}
                                className="gh-stats-bar-text"
                            >
                                {(type === 'top-locations') && getCountryFlag(label)}
                                {(type === 'top-sources') && (
                                    <img
                                        src={`https://www.google.com/s2/favicons?domain=${label || 'direct'}&sz=32`}
                                        className="gh-stats-favicon"
                                    />
                                )}
                                {type === 'top-sources' && <span title={label || unknownOption}>{label || unknownOption}</span>}
                                {type === 'top-locations' && <span title={this.getCountryName(label) || unknownOption}>{this.getCountryName(label) || unknownOption}</span>}
                                {type === 'top-pages' && <span title={label || unknownOption}>{label}</span>}
                            </a>
                            {(type === 'top-sources' || type === 'top-pages') && label && <a href={type === 'top-sources' ? `https://${label}` : label} target="_blank" className="gh-stats-external-link"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg></a>}
                        </span>
                    )
                }}
                categories={['visits']}
                categoryConfig={{
                    visits: {
                        label: <span className="gh-stats-data-header">Visits</span>,
                        renderValue: ({value}) => <span className="gh-stats-data-value">{formatNumber(value)}</span>
                    }
                }}
                colorPalette={[barListColor]}
            />
        );
    };
}
