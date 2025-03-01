import React, {useEffect} from 'react';
import {FlatList, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {dummyNoticeItemData} from '@/mock/NoticeBoard/NoticeBoard';
import {dummyNoticeItem} from '@/mock/NoticeBoard/types';
import {commonStyle} from '@/styles/common';
import {splitStringByDot} from '@/utils/splitStringByDot';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '@/types/Router';

const NoticeBoard = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const gotoNoticeBoardDetail = (item: dummyNoticeItem) => {
    navigation.navigate('NoticeBoardDetail', {...item});
  };

  const renderNoticeItem = ({item}: {item: dummyNoticeItem}) => (
    <TouchableOpacity
      style={styles.renderContainer}
      onPress={() => gotoNoticeBoardDetail(item)}>
      <Text style={commonStyle.REGULAR_33_16}>{item.title}</Text>
      <Text
        numberOfLines={1}
        style={{...commonStyle.REGULAR_33_14, width: 210}}>
        {splitStringByDot(item.content)[0]}
      </Text>
      <Text style={commonStyle.REGULAR_77_12}>{item.create_date}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={{flex: 1, paddingHorizontal: 24, backgroundColor: '#FFF'}}>
      <FlatList
        data={dummyNoticeItemData}
        keyExtractor={item => item.id}
        renderItem={renderNoticeItem}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  renderContainer: {
    gap: 4,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#EFEFEF',
  },
});

export default NoticeBoard;
