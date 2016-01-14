import React from 'react';

// Material UI
import CircularProgress from 'material-ui/lib/circular-progress';
import Paper from 'material-ui/lib/paper';
import RaisedButton from 'material-ui/lib/raised-button';

// D2
import {config} from 'd2/lib/d2';

// D2-UI
import TranslateMixin from '../i18n/Translate.mixin.js';

// TODO: TOAST!
// TODO: Undo support (in TOAST?)

config.i18n.strings.add('selected');
config.i18n.strings.add('assign_all');
config.i18n.strings.add('remove_all');
config.i18n.strings.add('hidden by filters');

export default React.createClass({
    propTypes: {
        // itemStore: d2-ui store containing all available items, either as a D2 ModelCollection,
        // or an array on the following format: [{value: 1, text: '1'}, {value: 2, text: '2'}, ...]
        itemStore: React.PropTypes.object.isRequired,

        // assignedItemStore: d2-ui store containing all items assigned to the current group, either
        // as a D2 ModelCollectionProperty or an array of ID's that match values in the itemStore
        assignedItemStore: React.PropTypes.object.isRequired,

        // filterText: A string that will be used to filter items in both columns
        filterText: React.PropTypes.string,

        // Note: Callbacks should return a promise that will resolve when the operation succeeds
        // and is rejected when it fails. The component will be in a loading state until the promise
        // resolves or is rejected.

        // assign items callback, called with an array of values to be assigned to the group
        onAssignItems: React.PropTypes.func,

        // remove items callback, called with an array of values to be removed from the group
        onRemoveItems: React.PropTypes.func,

        // The height of the component, defaults to 500px
        height: React.PropTypes.number,
    },

    contextTypes: {
        d2: React.PropTypes.object,
    },

    mixins: [TranslateMixin],

    componentDidMount() {
        this.disposables = [];

        this.disposables.push(this.props.itemStore.subscribe((itemStore) => {
            this.setState({loading: itemStore.length === 0});
        }));

        this.disposables.push(this.props.assignedItemStore.subscribe(() => {
            this.forceUpdate();
        }));
    },

    componentWillReceiveProps(props) {
        if (props.hasOwnProperty('filterText') && this.leftSelect && this.rightSelect) {
            this.setState({
                selectedLeft: [].filter.call(this.leftSelect.selectedOptions, item => item.text.toLowerCase().indexOf(('' + props.filterText).trim().toLowerCase()) !== -1).length,
                selectedRight: [].filter.call(this.rightSelect.selectedOptions, item => item.text.toLowerCase().indexOf(('' + props.filterText).trim().toLowerCase()) !== -1).length,
            });
        }
    },

    componentWillUnmount() {
        this.disposables.forEach(disposable => {
            disposable.dispose();
        });
    },

    getDefaultProps() {
        return {
            height: 500,
            filterText: '',
        };
    },

    getInitialState() {
        return {
            // Number of items selected in the left/right columns
            selectedLeft: 0,
            selectedRight: 0,

            // Loading
            loading: true,
        };
    },

    //
    // Data handling utility functions
    //
    getItemStoreIsCollection() {
        return this.props.itemStore.state !== undefined && this.props.itemStore.state.constructor.name.indexOf('ModelCollection') !== -1;
    },
    getItemStoreIsArray() {
        return this.props.itemStore.state !== undefined && this.props.itemStore.state.constructor.name === 'Array';
    },
    getAssignedItemStoreIsCollection() {
        return this.props.assignedItemStore.state !== undefined && this.props.assignedItemStore.state.constructor.name.indexOf('ModelCollection') !== -1;
    },
    getAssignedItemStoreIsArray() {
        return this.props.assignedItemStore.state !== undefined && this.props.assignedItemStore.state.constructor.name === 'Array';
    },
    getAllItems() {
        return this.getItemStoreIsCollection() ? this.props.itemStore.state.toArray().map(item => {
            return {value: item.id, text: item.name};
        }) : this.props.itemStore.state || [];
    },
    getItemCount() {
        return this.getItemStoreIsCollection() && this.props.itemStore.state.size || this.getItemStoreIsArray() && this.props.itemStore.state.length || 0;
    },
    getIsValueAssigned(value) {
        return this.getAssignedItemStoreIsCollection() ? this.props.assignedItemStore.state.has(value) : this.props.assignedItemStore.state.indexOf(value) !== -1;
    },
    getAssignedItems() {
        return this.getAllItems().filter(item => this.getIsValueAssigned(item.value));
    },
    getAvailableItems() {
        return this.getAllItems().filter(item => !this.getIsValueAssigned(item.value));
    },
    getAllItemsFiltered() {
        return this.filterItems(this.getAllItems());
    },
    getAssignedItemsFiltered() {
        return this.filterItems(this.getAssignedItems());
    },
    getAvailableItemsFiltered() {
        return this.filterItems(this.getAvailableItems());
    },
    getAssignedItemsCount() {
        return this.getAssignedItems().length;
    },
    getAvailableItemsCount() {
        return this.getAvailableItems().length;
    },
    getAssignedItemsFilterCount() {
        return this.getFilterText().length === 0 ? 0 : this.getAssignedItems().length - this.getAssignedItemsFiltered().length;
    },
    getAvailableItemsFilterCount() {
        return this.getFilterText().length === 0 ? 0 : this.getAvailableItems().length - this.getAvailableItemsFiltered().length;
    },
    getAssignedItemsUnfilteredCount() {
        return this.getFilterText().length === 0 ? this.getAssignedItemsCount() : this.getAssignedItemsCount() - this.getAssignedItemsFilterCount();
    },
    getAvailableItemsUnfilteredCount() {
        return this.getFilterText().length === 0 ? this.getAvailableItemsCount() : this.getAvailableItemsCount() - this.getAvailableItemsFilterCount();
    },
    getFilterText() {
        return this.props.filterText ? this.props.filterText.trim().toLowerCase() : '';
    },
    getAvailableSelectedCount() {
        return Math.max(this.state.selectedLeft, 0);
    },
    getAssignedSelectedCount() {
        return Math.max(this.state.selectedRight, 0);
    },
    getSelectedCount() {
        return Math.max(this.getAvailableSelectedCount(), this.getAssignedSelectedCount());
    },

    //
    // Rendering
    //
    render() {
        const filterHeight = this.getFilterText().length > 0 ? 15 : 0;
        const styles = {
            container: {
                display: 'flex',
                marginTop: 16,
                marginBottom: 32,
                height: this.props.height,
            },
            left: {
                flex: '1 0 120px',
            },
            middle: {
                flex: '0 0 120px',
                alignSelf: 'center',
                textAlign: 'center',
            },
            right: {
                flex: '1 0 120px',
            },
            paper: {
                width: '100%',
                height: '100%',
            },
            select: {
                width: '100%',
                minHeight: '50',
                height: this.props.height - filterHeight,
                border: 'none',
                fontFamily: 'Roboto',
                fontSize: 13,
                outline: 'none',
            },
            buttons: {
                minWidth: 100,
                maxWidth: 100,
                marginTop: 8,
            },
            selected: {
                fontSize: 13,
                minHeight: 15,
                marginTop: 45,
                padding: '0 8px',
            },
            status: {
                marginTop: 8,
                minHeight: 60,
            },
            hidden: {
                fontSize: 13,
                color: '#404040',
                fontStyle: 'italic',
                textAlign: 'center',
                width: '100%',
                background: '#d0d0d0',
                maxHeight: 15,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
            },
        };

        const onChangeLeft = (e) => {
            this.clearSelection(false, true);
            this.setState({
                selectedLeft: e.target.selectedOptions.length,
            });
        };

        const onChangeRight = (e) => {
            this.clearSelection(true, false);
            this.setState({
                selectedRight: e.target.selectedOptions.length,
            });
        };

        const hiddenLabel = (itemCount) => {
            return this.getItemCount() > 0 && this.getFilterText().length > 0 ? itemCount + ' ' + this.getTranslation('hidden by filters') : '';
        };

        const selectedLabel = () => {
            return this.getSelectedCount() > 0 ? this.getSelectedCount() + ' ' + this.getTranslation('selected') : '';
        };

        return (
            <div style={styles.container}>
                <div style={styles.left}>
                    <Paper style={styles.paper}>
                        <div style={styles.hidden}>{hiddenLabel(this.getAvailableItemsFilterCount())}</div>
                        <select multiple style={styles.select} onChange={onChangeLeft}
                                ref={r => { this.leftSelect = r; }}>
                            {this.getAvailableItemsFiltered().map(item => {
                                return (
                                    <option key={item.value} value={item.value}
                                            onDoubleClick={this._assignItems}>{item.text}</option>
                                );
                            })}
                        </select>
                    </Paper>
                    <RaisedButton
                        label={this.getTranslation('assign_all') + ' ' + (this.getAvailableItemsUnfilteredCount() === 0 ? '' : this.getAvailableItemsUnfilteredCount()) + ' \u2192'}
                        disabled={this.state.loading || this.getAvailableItemsUnfilteredCount() === 0}
                        onClick={this._assignAll}
                        secondary/>
                </div>
                <div style={styles.middle}>
                    <div style={styles.selected}>{selectedLabel()}</div>
                    <RaisedButton
                        label="&rarr;"
                        secondary
                        onClick={this._assignItems}
                        style={styles.buttons}
                        disabled={this.state.loading || this.state.selectedLeft === 0}/>
                    <RaisedButton
                        label="&larr;"
                        secondary
                        onClick={this._removeItems}
                        style={styles.buttons}
                        disabled={this.state.loading || this.state.selectedRight === 0}/>
                    <div style={styles.status}>
                        {this.state.loading ?
                            <CircularProgress size={0.5} style={{width: 60, height: 60}}/> : undefined }
                    </div>
                </div>
                <div style={styles.right}>
                    <Paper style={styles.paper}>
                        <div style={styles.hidden}>{hiddenLabel(this.getAssignedItemsFilterCount())}</div>
                        <select multiple style={styles.select} onChange={onChangeRight}
                                ref={ r => {this.rightSelect = r; }}>
                            {this.getAssignedItemsFiltered().map(item => {
                                return (<option key={item.value} value={item.value}
                                                onDoubleClick={this._removeItems}>{item.text}</option>);
                            })}
                        </select>
                    </Paper>
                    <RaisedButton
                        label={'\u2190 ' + this.getTranslation('remove_all') + ' ' + (this.getAssignedItemsUnfilteredCount() > 0 ? this.getAssignedItemsUnfilteredCount() : '')}
                        style={{float: 'right'}}
                        disabled={this.state.loading || this.getAssignedItemsUnfilteredCount() === 0}
                        onClick={this._removeAll}
                        secondary/>
                </div>
            </div>
        );
    },

    clearSelection(left = true, right = true) {
        if (left) {
            this.leftSelect.selectedIndex = -1;
        }

        if (right) {
            this.rightSelect.selectedIndex = -1;
        }

        this.setState(state => {
            return {
                selectedLeft: left ? 0 : state.selectedLeft,
                selectedRight: right ? 0 : state.selectedRight,
            };
        });
    },

    filterItems(items) {
        return items.filter(item => {
            return this.getFilterText().length === 0 || item.text.trim().toLowerCase().indexOf(this.getFilterText()) !== -1;
        });
    },

    //
    // Event handlers
    //
    _assignItems() {
        this.setState({loading: true});
        this.props.onAssignItems([].map.call(this.leftSelect.selectedOptions, item => item.value))
            .then(() => {
                this.clearSelection();
                this.setState({loading: false});
            })
            .catch(() => {
                this.setState({loading: false});
            });
    },

    _removeItems() {
        this.setState({loading: true});
        this.props.onRemoveItems([].map.call(this.rightSelect.selectedOptions, item => item.value))
            .then(() => {
                this.clearSelection();
                this.setState({loading: false});
            })
            .catch(() => {
                this.setState({loading: false});
            });
    },

    _assignAll() {
        this.setState({loading: true});
        this.props.onAssignItems([].map.call(this.leftSelect.options, item => item.value))
            .then(() => {
                this.clearSelection();
                this.setState({loading: false});
            }).catch(() => {
                this.setState({loading: false});
            });
    },

    _removeAll() {
        this.setState({loading: true});
        this.props.onRemoveItems([].map.call(this.rightSelect.options, item => item.value))
            .then(() => {
                this.clearSelection();
                this.setState({loading: false});
            }).catch(() => {
                this.setState({loading: false});
            });
    },
});