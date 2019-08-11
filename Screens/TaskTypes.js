import React, { Component } from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import SQLite from 'react-native-sqlite-storage';
import { NavigationEvents } from 'react-navigation';
import { Header, Icon, ListItem, Overlay, Input, Button } from 'react-native-elements';
import { ScrollView } from 'react-native-gesture-handler';

export default class TaskTypes extends Component {
    constructor(props) {
        super();

        this.state = {
            addModalActive: false,
            modalMode: "add"
        }

        this.deleteTaskType = this.deleteTaskType.bind(this);
        this.addNewTaskType = this.addNewTaskType.bind(this);
        this.editTaskType = this.editTaskType.bind(this);
    }

    editTaskType() {
        if (this.state.selectedTaskType && this.state.selectedTaskType.id && this.props.navigation.state.params.db) {
            this.props.navigation.state.params.db.transaction((txn) => {
                txn.executeSql(`UPDATE tasktype SET name="${this.state.taskname}" WHERE id=${this.state.selectedTaskType.id}`, [])
            })
                .then(() => {
                    console.log("Successfully updated record!");
                    this.setState({ addModalActive: false, selectedTaskType: null });
                    this.getTaskTypes();
                })
                .catch((err) => {
                    console.error(err);
                })
        }
    }

    deleteTaskType() {
        if (this.state.selectedTaskType && this.state.selectedTaskType.id && this.props.navigation.state.params.db) {
            this.props.navigation.state.params.db.transaction((txn) => {
                txn.executeSql(`DELETE FROM tasktype WHERE id=${this.state.selectedTaskType.id}`, []);
            })
                .then(() => {
                    console.log("Successfully deleted record!");
                    this.setState({ selectedTaskType: null, addModalActive: false });
                    this.getTaskTypes();
                })
                .catch((err) => {
                    console.error(err);
                })
        }
    }

    getTaskTypes() {
        let tempArr = [];
        if (this.props.navigation.state.params.db) {
            this.props.navigation.state.params.db.transaction((txn) => {
                txn.executeSql('SELECT * FROM tasktype', [], (tx, results) => {
                    for (let i = 0; i < results.rows.length; i++) {
                        let row = results.rows.item(i);
                        tempArr.push(row);
                    }
                })
            })
                .then(() => {
                    this.setState({
                        tasktypes: tempArr
                    })
                })
        } else {
            console.error("Database connection error!");
        }
    }

    addNewTaskType() {
        if (this.props.navigation.state.params.db) {
            this.props.navigation.state.params.db.transaction((txn) => {
                txn.executeSql(`INSERT INTO tasktype (name) VALUES ("${this.state.taskname}")`, [], (tx, results) => {
                })
            })
                .then(() => {
                    this.getTaskTypes();
                    this.setState({ addModalActive: false });
                })
                .catch((err) => {
                    console.error(err);
                })
        } else {
            console.error("Database connection error!");
        }
    }

    // componentDidUpdate() {
    //     console.log(this.state);
    // }

    render() {

        let height = Math.round(Dimensions.get('window').height);
        let width = Math.round(Dimensions.get('window').width);

        if (this.state && this.state.tasktypes) {
            return (
                <View style={{ flex: 1, flexDirection: 'column' }}>
                    <Header
                        backgroundColor='#327ba8'
                        leftComponent={
                            <TouchableOpacity onPress={() => this.props.navigation.navigate('Home')}>
                                <Icon
                                    name="arrow-left"
                                    type='feather'
                                    color='#fff'
                                />
                            </TouchableOpacity>}
                        centerComponent={{ text: 'Manage Task Types', style: { color: '#fff', fontSize: 22 } }}
                        rightComponent={null}
                    />
                    <Overlay height={height / 2} isVisible={this.state.addModalActive} onBackdropPress={() => this.setState({ addModalActive: false })}>
                        <View style={{ flex: 1, flexDirection: 'column' }}>
                            <View style={{ flex: 3, marginTop: 30 }}>
                                <Input value={this.state.taskname} onChangeText={(text) => this.setState({ taskname: text })} label="Task Type Name" placeholder="What kind of task is this..." />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Button buttonStyle={{ backgroundColor: '#327ba8' }}
                                    title={this.state.modalMode === "add" ? "Add" : "Save"}
                                    disabled={this.state.taskname ? false : true}
                                    onPress={this.state.modalMode === "add" ? this.addNewTaskType : this.editTaskType} />
                            </View>
                            {this.state.modalMode === "edit"
                                ? (<View style={{ flex: 1 }}><Button buttonStyle={{ backgroundColor: 'red' }} title="Delete" onPress={this.deleteTaskType} /></View>)
                                : (null)
                            }
                            <View style={{ flex: 1 }}>
                                <Button buttonStyle={{ backgroundColor: 'grey' }} title="Cancel" onPress={() => this.setState({ addModalActive: false })} />
                            </View>
                        </View>
                    </Overlay>
                    <ScrollView style={{ flex: 2 }}>
                        {
                            this.state.tasktypes.map((type, i) => {
                                return <ListItem key={i} title={type.name} onPress={() => this.setState({ taskname: type.name, addModalActive: true, modalMode: "edit", selectedTaskType: type })} />
                            })
                        }
                    </ScrollView>
                    <View style={{ position: 'absolute', top: height - 100, left: width - 100 }}>
                        <TouchableOpacity onPress={() => this.setState({ addModalActive: true, modalMode: "add", taskname: "" })}>
                            <Icon name="plus" type='feather' color='#327ba8' reverse />
                        </TouchableOpacity>
                    </View>
                </View>
            )
        } else {
            return (
                <View style={{ flex: 1, flexDirection: 'column' }}>
                    <NavigationEvents onWillFocus={() => this.getTaskTypes()} />
                    <Header
                        backgroundColor='#327ba8'
                        leftComponent={
                            <TouchableOpacity onPress={() => this.props.navigation.navigate('Home')}>
                                <Icon
                                    name="arrow-left"
                                    type='feather'
                                    color='#fff'
                                />
                            </TouchableOpacity>}
                        centerComponent={{ text: 'Manage Task Types', style: { color: '#fff', fontSize: 22 } }}
                        rightComponent={null}
                    />
                    <View style={{ flex: 2 }}>
                        <Text>Task types here</Text>
                    </View>
                </View>
            )
        }
    }
}