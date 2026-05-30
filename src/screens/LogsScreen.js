import React from 'react';
import {View,Text,FlatList,TouchableOpacity,StyleSheet,Alert} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import useStore from '../store/useStore';

function timeAgo(ts) {
  const d = Math.floor((Date.now()-ts)/1000);
  if(d<60) return d+'s ago';
  if(d<3600) return Math.floor(d/60)+'m ago';
  if(d<86400) return Math.floor(d/3600)+'h ago';
  return Math.floor(d/86400)+'d ago';
}

export default function LogsScreen() {
  const {logs,clearLogs} = useStore();
  const confirmClear = () => Alert.alert('Clear All Logs','This will delete all activity logs.',[{text:'Cancel'},{text:'Clear All',style:'destructive',onPress:clearLogs}]);
  const renderItem = ({item}) => (
    <View style={[s.card, item.action==='blocked'?s.cardBlocked:s.cardAllowed]}>
      <Text style={s.typeIcon}>{item.type==='call'?'📞':'💬'}</Text>
      <View style={s.info}>
        <Text style={s.phone}>{item.phone||'Unknown'}</Text>
        <Text style={s.time}>{item.type==='call'?'Call':'SMS'} · {timeAgo(item.timestamp)}</Text>
      </View>
      <View style={[s.badge, item.action==='blocked'?s.blockedBadge:s.allowedBadge]}>
        <Text style={[s.badgeTxt, item.action==='blocked'?s.blockedTxt:s.allowedTxt]}>
          {item.action==='blocked'?'🚫 Blocked':'✓ Allowed'}
        </Text>
      </View>
    </View>
  );
  return (
    <SafeAreaView style={s.wrap}>
      <View style={s.hdr}>
        <View><Text style={s.title}>Activity Log</Text><Text style={s.sub}>{logs.length} entries</Text></View>
        {logs.length>0&&<TouchableOpacity onPress={confirmClear} style={s.clearBtn}><Text style={s.clearTxt}>Clear All</Text></TouchableOpacity>}
      </View>
      {logs.length===0?(
        <View style={s.empty}><Text style={s.emptyIcon}>📋</Text><Text style={s.emptyTitle}>No activity yet</Text><Text style={s.emptySub}>Blocked calls and SMS will appear here</Text></View>
      ):(
        <FlatList data={logs} keyExtractor={i=>i.id} renderItem={renderItem} contentContainerStyle={{paddingHorizontal:16,paddingBottom:20}} showsVerticalScrollIndicator={false} />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  wrap:{flex:1,backgroundColor:'#0a0a12'},
  hdr:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:16,marginTop:16,marginBottom:12},
  title:{fontSize:26,fontWeight:'800',color:'#e8f4ff'},
  sub:{fontSize:12,color:'#4a6080'},
  clearBtn:{backgroundColor:'#2a1010',paddingHorizontal:14,paddingVertical:8,borderRadius:10},
  clearTxt:{color:'#e74c3c',fontWeight:'700',fontSize:13},
  card:{borderRadius:14,padding:14,marginBottom:8,flexDirection:'row',alignItems:'center'},
  cardBlocked:{backgroundColor:'#1a0a0a',borderWidth:1,borderColor:'#3a1010'},
  cardAllowed:{backgroundColor:'#0a1a0a',borderWidth:1,borderColor:'#103a10'},
  typeIcon:{fontSize:26,marginRight:12},
  info:{flex:1},
  phone:{color:'#e0f0ff',fontWeight:'700',fontSize:15},
  time:{color:'#3a5070',fontSize:11,marginTop:2},
  badge:{paddingHorizontal:10,paddingVertical:5,borderRadius:8},
  blockedBadge:{backgroundColor:'#2a0d0d'},
  allowedBadge:{backgroundColor:'#0d2a0d'},
  badgeTxt:{fontWeight:'700',fontSize:12},
  blockedTxt:{color:'#e74c3c'},
  allowedTxt:{color:'#2ecc71'},
  empty:{flex:1,alignItems:'center',justifyContent:'center'},
  emptyIcon:{fontSize:48,marginBottom:12},
  emptyTitle:{fontSize:18,fontWeight:'700',color:'#e0f0ff'},
  emptySub:{fontSize:13,color:'#4a6080',marginTop:6},
});
