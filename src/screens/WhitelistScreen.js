import React, {useState, useCallback} from 'react';
import {View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Switch, Modal, Alert, ActivityIndicator, NativeModules} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import useStore from '../store/useStore';
const {CallShieldModule} = NativeModules;

export default function WhitelistScreen() {
  const {whitelist, addContact, removeContact, updateContact} = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [allowCalls, setAllowCalls] = useState(true);
  const [allowSMS, setAllowSMS] = useState(true);
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const loadContacts = useCallback(async () => {
    if (!CallShieldModule) {Alert.alert('Not Available', 'Native module not loaded. Rebuild the app.'); return;}
    setLoading(true);
    try {const c = await CallShieldModule.getContacts(); setContacts(c || []);}
    catch (e) {Alert.alert('Permission Needed', 'Grant Contacts permission in Settings.');}
    finally {setLoading(false);}
  }, []);

  const norm = p => String(p||'').replace(/\s/g,'').replace(/^\+254/,'0');

  const handleAdd = () => {
    if (!phone.trim()) {Alert.alert('Error','Enter a phone number.'); return;}
    addContact({name:name.trim()||phone.trim(), phone:phone.trim(), allowCalls, allowSMS});
    setName(''); setPhone(''); setAllowCalls(true); setAllowSMS(true); setShowAdd(false);
  };

  const pickContact = c => {
    if (whitelist.some(w => norm(w.phone) === norm(c.phone))) {Alert.alert('Already Added',`${c.name} is in your whitelist.`); return;}
    addContact({name:c.name, phone:c.phone, allowCalls:true, allowSMS:true});
    setShowPicker(false);
  };

  const filtered = contacts.filter(c => (c.name||'').toLowerCase().includes(search.toLowerCase()) || (c.phone||'').includes(search));

  const renderItem = ({item}) => (
    <View style={s.card}>
      <View style={s.cardL}>
        <View style={s.av}><Text style={s.avTxt}>{(item.name||'?')[0].toUpperCase()}</Text></View>
        <View style={s.info}><Text style={s.cName}>{item.name}</Text><Text style={s.cPhone}>{item.phone}</Text></View>
      </View>
      <View style={s.cardR}>
        <Text style={s.tLabel}>📞</Text>
        <Switch value={!!item.allowCalls} onValueChange={v=>updateContact(item.id,{allowCalls:v})} trackColor={{true:'#2d7dd2',false:'#222'}} thumbColor="#fff" />
        <Text style={s.tLabel}>💬</Text>
        <Switch value={!!item.allowSMS} onValueChange={v=>updateContact(item.id,{allowSMS:v})} trackColor={{true:'#2d7dd2',false:'#222'}} thumbColor="#fff" />
        <TouchableOpacity onPress={()=>Alert.alert('Remove',`Remove ${item.name}?`,[{text:'Cancel'},{text:'Remove',style:'destructive',onPress:()=>removeContact(item.id)}])}>
          <Text style={s.del}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={s.wrap}>
      <View style={s.hdr}>
        <View><Text style={s.title}>Whitelist</Text><Text style={s.sub}>{whitelist.length} contacts allowed</Text></View>
        <View style={s.hdrBtns}>
          <TouchableOpacity style={s.btn} onPress={()=>{setSearch('');setShowPicker(true);loadContacts();}}><Text style={s.btnTxt}>📱 Contacts</Text></TouchableOpacity>
          <TouchableOpacity style={[s.btn,{marginLeft:8}]} onPress={()=>setShowAdd(true)}><Text style={s.btnTxt}>+ Manual</Text></TouchableOpacity>
        </View>
      </View>
      {whitelist.length === 0 ? (
        <View style={s.empty}><Text style={s.emptyIcon}>🔒</Text><Text style={s.emptyTitle}>No whitelisted contacts</Text><Text style={s.emptySub}>Everyone will be blocked when shield is active. Add contacts to allow them through.</Text></View>
      ) : (
        <FlatList data={whitelist} keyExtractor={i=>i.id} renderItem={renderItem} contentContainerStyle={{paddingBottom:20}} showsVerticalScrollIndicator={false} />
      )}

      <Modal visible={showAdd} transparent animationType="slide">
        <View style={s.overlay}><View style={s.modal}>
          <Text style={s.modalTitle}>Add Manually</Text>
          <Text style={s.fieldLabel}>Name (optional)</Text>
          <TextInput style={s.input} value={name} onChangeText={setName} placeholder="e.g. Mom" placeholderTextColor="#444" />
          <Text style={s.fieldLabel}>Phone Number *</Text>
          <TextInput style={s.input} value={phone} onChangeText={setPhone} placeholder="e.g. 0712345678" placeholderTextColor="#444" keyboardType="phone-pad" />
          <View style={s.swRow}><Text style={s.fieldLabel}>Allow Calls</Text><Switch value={allowCalls} onValueChange={setAllowCalls} trackColor={{true:'#2d7dd2',false:'#333'}} /></View>
          <View style={s.swRow}><Text style={s.fieldLabel}>Allow SMS</Text><Switch value={allowSMS} onValueChange={setAllowSMS} trackColor={{true:'#2d7dd2',false:'#333'}} /></View>
          <View style={s.mBtns}>
            <TouchableOpacity style={s.cancelBtn} onPress={()=>setShowAdd(false)}><Text style={s.cancelTxt}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={s.saveBtn} onPress={handleAdd}><Text style={s.saveTxt}>Add Contact</Text></TouchableOpacity>
          </View>
        </View></View>
      </Modal>

      <Modal visible={showPicker} transparent animationType="slide">
        <View style={s.overlay}><View style={[s.modal,{maxHeight:'85%'}]}>
          <View style={s.pickerHdr}><Text style={s.modalTitle}>Phone Book</Text><TouchableOpacity onPress={()=>setShowPicker(false)}><Text style={s.close}>✕</Text></TouchableOpacity></View>
          <TextInput style={[s.input,{marginBottom:12}]} value={search} onChangeText={setSearch} placeholder="Search..." placeholderTextColor="#444" />
          {loading ? <ActivityIndicator color="#5db8ff" size="large" style={{marginVertical:30}} /> :
            <FlatList data={filtered} keyExtractor={i=>`${i.id}-${i.phone}`} style={{maxHeight:400}}
              renderItem={({item})=>{
                const inList = whitelist.some(w=>norm(w.phone)===norm(item.phone));
                return (
                  <TouchableOpacity style={[s.pItem, inList&&{opacity:0.5}]} onPress={()=>!inList&&pickContact(item)} disabled={inList}>
                    <View style={[s.av,{width:34,height:34,borderRadius:17,marginRight:10}]}><Text style={s.avTxt}>{(item.name||'?')[0].toUpperCase()}</Text></View>
                    <View style={{flex:1}}><Text style={s.cName}>{item.name}</Text><Text style={s.cPhone}>{item.phone}</Text></View>
                    {inList?<Text style={{color:'#2ecc71',fontSize:12,fontWeight:'700'}}>✓ Added</Text>:<Text style={{color:'#5db8ff',fontSize:13,fontWeight:'700'}}>+ Add</Text>}
                  </TouchableOpacity>
                );
              }}
            />}
        </View></View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  wrap:{flex:1,backgroundColor:'#0a0a12'},
  hdr:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:16,marginTop:16,marginBottom:12,flexWrap:'wrap'},
  title:{fontSize:26,fontWeight:'800',color:'#e8f4ff'},
  sub:{fontSize:12,color:'#4a6080',marginTop:2},
  hdrBtns:{flexDirection:'row'},
  btn:{backgroundColor:'#1e3a5f',paddingHorizontal:12,paddingVertical:9,borderRadius:10},
  btnTxt:{color:'#5db8ff',fontWeight:'700',fontSize:13},
  card:{backgroundColor:'#111825',borderRadius:14,padding:14,marginBottom:8,marginHorizontal:16,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
  cardL:{flexDirection:'row',alignItems:'center',flex:1},
  av:{width:42,height:42,borderRadius:21,backgroundColor:'#1e3a5f',alignItems:'center',justifyContent:'center',marginRight:12},
  avTxt:{color:'#5db8ff',fontWeight:'800',fontSize:17},
  info:{flex:1},
  cName:{color:'#e0f0ff',fontWeight:'700',fontSize:15},
  cPhone:{color:'#4a6080',fontSize:12,marginTop:2},
  cardR:{flexDirection:'row',alignItems:'center'},
  tLabel:{fontSize:13,marginLeft:4},
  del:{color:'#c0392b',fontWeight:'700',fontSize:16,marginLeft:8},
  empty:{flex:1,alignItems:'center',justifyContent:'center',paddingHorizontal:30},
  emptyIcon:{fontSize:48,marginBottom:14},
  emptyTitle:{fontSize:18,fontWeight:'700',color:'#e0f0ff',textAlign:'center'},
  emptySub:{fontSize:13,color:'#4a6080',textAlign:'center',marginTop:8,lineHeight:20},
  overlay:{flex:1,backgroundColor:'rgba(0,0,0,0.8)',justifyContent:'flex-end'},
  modal:{backgroundColor:'#111825',borderTopLeftRadius:24,borderTopRightRadius:24,padding:24,paddingBottom:40},
  modalTitle:{fontSize:20,fontWeight:'800',color:'#e8f4ff',marginBottom:12},
  pickerHdr:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:4},
  close:{color:'#5a7fa8',fontSize:18,padding:4},
  fieldLabel:{color:'#5a7fa8',fontSize:13,fontWeight:'600',marginBottom:6,marginTop:12},
  input:{backgroundColor:'#0d1421',borderRadius:10,color:'#e0f0ff',padding:12,fontSize:15,borderWidth:1,borderColor:'#1a2a3a'},
  swRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:12},
  mBtns:{flexDirection:'row',marginTop:24},
  cancelBtn:{flex:1,backgroundColor:'#1a1a28',borderRadius:12,padding:14,alignItems:'center',marginRight:6},
  cancelTxt:{color:'#5a7fa8',fontWeight:'700'},
  saveBtn:{flex:1,backgroundColor:'#1e3a5f',borderRadius:12,padding:14,alignItems:'center',marginLeft:6},
  saveTxt:{color:'#5db8ff',fontWeight:'700'},
  pItem:{flexDirection:'row',alignItems:'center',paddingVertical:10,borderBottomWidth:1,borderBottomColor:'#1a2232'},
});
