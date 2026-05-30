import React, {useState} from 'react';
import {View,Text,TouchableOpacity,StyleSheet,FlatList,Switch,Modal,Alert,TextInput} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import useStore from '../store/useStore';
import {isScheduleActive, formatSchedule} from '../services/ShieldEngine';

const DAYS=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function ScheduleScreen() {
  const {schedules,addSchedule,removeSchedule,toggleSchedule} = useStore();
  const [modal,setModal] = useState(false);
  const [label,setLabel] = useState('');
  const [days,setDays] = useState([1,2,3,4,5]);
  const [start,setStart] = useState('22:00');
  const [end,setEnd] = useState('07:00');

  const toggleDay = d => setDays(prev => prev.includes(d)?prev.filter(x=>x!==d):[...prev,d].sort((a,b)=>a-b));

  const handleAdd = () => {
    if (days.length===0){Alert.alert('Error','Select at least one day.');return;}
    addSchedule({label:label.trim()||'My Schedule',days,startTime:start,endTime:end,active:true});
    setLabel('');setDays([1,2,3,4,5]);setStart('22:00');setEnd('07:00');setModal(false);
  };

  const renderItem = ({item}) => {
    const running = isScheduleActive(item);
    return (
      <View style={s.card}>
        <View style={s.cardTop}>
          <View style={{flex:1}}>
            <View style={s.labelRow}>
              <Text style={s.cLabel}>{item.label}</Text>
              {running && <View style={s.liveBadge}><Text style={s.liveTxt}>● ACTIVE</Text></View>}
            </View>
            <Text style={s.cTime}>{formatSchedule(item)}</Text>
          </View>
          <Switch value={!!item.active} onValueChange={()=>toggleSchedule(item.id)} trackColor={{true:'#2d7dd2',false:'#222'}} thumbColor="#fff" />
        </View>
        <TouchableOpacity style={s.delBtn} onPress={()=>Alert.alert('Delete',`Delete "${item.label}"?`,[{text:'Cancel'},{text:'Delete',style:'destructive',onPress:()=>removeSchedule(item.id)}])}>
          <Text style={s.delTxt}>Delete Schedule</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.wrap}>
      <View style={s.hdr}>
        <View><Text style={s.title}>Schedules</Text><Text style={s.sub}>Auto-activate on a timetable</Text></View>
        <TouchableOpacity style={s.addBtn} onPress={()=>setModal(true)}><Text style={s.addTxt}>+ Add</Text></TouchableOpacity>
      </View>
      {schedules.length===0?(
        <View style={s.empty}>
          <Text style={s.emptyIcon}>🕐</Text>
          <Text style={s.emptyTitle}>No schedules yet</Text>
          <Text style={s.emptySub}>Create a schedule to auto-activate the shield at specific times (e.g. nights, weekends).</Text>
          <TouchableOpacity style={[s.addBtn,{marginTop:20}]} onPress={()=>setModal(true)}><Text style={s.addTxt}>+ Create Schedule</Text></TouchableOpacity>
        </View>
      ):(
        <FlatList data={schedules} keyExtractor={i=>i.id} renderItem={renderItem} contentContainerStyle={{paddingHorizontal:16,paddingBottom:20}} />
      )}

      <Modal visible={modal} transparent animationType="slide">
        <View style={s.overlay}><View style={s.modal}>
          <Text style={s.modalTitle}>New Schedule</Text>
          <Text style={s.fieldLabel}>Label</Text>
          <TextInput style={s.input} value={label} onChangeText={setLabel} placeholder="e.g. Night Mode" placeholderTextColor="#444" />
          <Text style={s.fieldLabel}>Days</Text>
          <View style={s.daysRow}>
            {DAYS.map((d,i)=>(
              <TouchableOpacity key={d} style={[s.dayBtn,days.includes(i)&&s.dayBtnOn]} onPress={()=>toggleDay(i)}>
                <Text style={[s.dayTxt,days.includes(i)&&s.dayTxtOn]}>{d[0]}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={s.timeRow}>
            <View style={{flex:1}}>
              <Text style={s.fieldLabel}>Start Time</Text>
              <TextInput style={s.input} value={start} onChangeText={setStart} placeholder="22:00" placeholderTextColor="#444" />
            </View>
            <View style={{width:12}} />
            <View style={{flex:1}}>
              <Text style={s.fieldLabel}>End Time</Text>
              <TextInput style={s.input} value={end} onChangeText={setEnd} placeholder="07:00" placeholderTextColor="#444" />
            </View>
          </View>
          <Text style={s.note}>Format: HH:MM (24hr). If end &lt; start, runs overnight.</Text>
          <View style={s.mBtns}>
            <TouchableOpacity style={s.cancelBtn} onPress={()=>setModal(false)}><Text style={s.cancelTxt}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={s.saveBtn} onPress={handleAdd}><Text style={s.saveTxt}>Add Schedule</Text></TouchableOpacity>
          </View>
        </View></View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  wrap:{flex:1,backgroundColor:'#0a0a12'},
  hdr:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:16,marginTop:16,marginBottom:12},
  title:{fontSize:26,fontWeight:'800',color:'#e8f4ff'},
  sub:{fontSize:12,color:'#4a6080'},
  addBtn:{backgroundColor:'#1e3a5f',paddingHorizontal:16,paddingVertical:10,borderRadius:10},
  addTxt:{color:'#5db8ff',fontWeight:'700'},
  card:{backgroundColor:'#111825',borderRadius:14,padding:14,marginBottom:10},
  cardTop:{flexDirection:'row',alignItems:'center'},
  labelRow:{flexDirection:'row',alignItems:'center',marginBottom:4},
  cLabel:{color:'#e0f0ff',fontWeight:'700',fontSize:16,marginRight:8},
  liveBadge:{backgroundColor:'#0d2a12',paddingHorizontal:8,paddingVertical:2,borderRadius:6},
  liveTxt:{color:'#4caf50',fontSize:10,fontWeight:'700'},
  cTime:{color:'#4a6080',fontSize:12},
  delBtn:{marginTop:10,paddingTop:10,borderTopWidth:1,borderTopColor:'#1a2a3a',alignItems:'center'},
  delTxt:{color:'#c0392b',fontWeight:'600',fontSize:13},
  empty:{flex:1,alignItems:'center',justifyContent:'center',paddingHorizontal:30},
  emptyIcon:{fontSize:48,marginBottom:12},
  emptyTitle:{fontSize:18,fontWeight:'700',color:'#e0f0ff'},
  emptySub:{fontSize:13,color:'#4a6080',marginTop:6,textAlign:'center',lineHeight:20},
  overlay:{flex:1,backgroundColor:'rgba(0,0,0,0.8)',justifyContent:'flex-end'},
  modal:{backgroundColor:'#111825',borderTopLeftRadius:24,borderTopRightRadius:24,padding:24,paddingBottom:44},
  modalTitle:{fontSize:20,fontWeight:'800',color:'#e8f4ff',marginBottom:12},
  fieldLabel:{color:'#5a7fa8',fontSize:12,fontWeight:'600',marginBottom:6,marginTop:12},
  input:{backgroundColor:'#0d1421',borderRadius:10,color:'#e0f0ff',padding:12,fontSize:15,borderWidth:1,borderColor:'#1a2a3a'},
  daysRow:{flexDirection:'row',justifyContent:'space-between'},
  dayBtn:{width:36,height:36,borderRadius:18,backgroundColor:'#1a1a28',alignItems:'center',justifyContent:'center'},
  dayBtnOn:{backgroundColor:'#1e3a5f'},
  dayTxt:{color:'#4a6080',fontWeight:'700'},
  dayTxtOn:{color:'#5db8ff'},
  timeRow:{flexDirection:'row',marginTop:4},
  note:{color:'#3a5570',fontSize:11,marginTop:8},
  mBtns:{flexDirection:'row',marginTop:20},
  cancelBtn:{flex:1,backgroundColor:'#1a1a28',borderRadius:12,padding:14,alignItems:'center',marginRight:6},
  cancelTxt:{color:'#5a7fa8',fontWeight:'700'},
  saveBtn:{flex:1,backgroundColor:'#1e3a5f',borderRadius:12,padding:14,alignItems:'center',marginLeft:6},
  saveTxt:{color:'#5db8ff',fontWeight:'700'},
});
