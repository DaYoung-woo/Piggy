import React, {useState, useCallback} from 'react';
import {
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
  SafeAreaView,
} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {BottomTabHeaderProps} from '@react-navigation/bottom-tabs';
import {StackHeaderProps, StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '@/types/Router';
import {LeftItemProps} from '@/types/Common';
import {commonStyle} from '@/styles/common';
import {
  getUnConfirmNotificationSpb,
  subcribeUnConfirmNotification,
} from '@/supabase/alarm';
import {useNotificationStore, useUserStore} from '@/store/store';
import {getPiggySpb} from '@/supabase/AuthSpb';
import AlertSvg from '@/assets/icons/alert.svg';
import SearchSvg from '@/assets/icons/search.svg';
import BackSvg from '@/assets/icons/leftArrow.svg';
import EditSvg from '@/assets/icons/edit.svg';
import GiftSvg from '@/assets/icons/gift.svg';

const topLogo = require('@/assets/icons/topLogo.png');

const LeftItem = ({name, headerLeftLabelVisible}: LeftItemProps) => {
  const navigation = useNavigation();
  const mainName = ['Home', 'Friends', 'Goods', 'Settings'];

  if (mainName.includes(name)) {
    return <Image source={topLogo} style={styles.logo} alt="topLogo" />;
  }

  if (headerLeftLabelVisible) {
    return (
      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          if (navigation.canGoBack()) {
            navigation.goBack();
          }
        }}>
        <BackSvg width={32} height={32} color={'#555'} />
      </TouchableOpacity>
    );
  }

  return <View style={styles.empty} />;
};

const Title = ({title}: {title: string}) => {
  return !title ? (
    <View />
  ) : (
    <Text style={commonStyle.MEDIUM_33_18}>{title}</Text>
  );
};

const Alarm = () => {
  const navigation = useNavigation<NavigationProp>();
  const {userData} = useUserStore();
  const [isUnConfirmAlarm, setIsUnConfirmAlarm] = useState('init');
  const handle = async () => {
    const isUnConfirm = await getUnConfirmNotificationSpb(userData.id);
    setIsUnConfirmAlarm(isUnConfirm.toString());
  };

  useFocusEffect(
    useCallback(() => {
      handle();
      subcribeUnConfirmNotification(userData.id, handle);
    }, []),
  );

  return (
    <TouchableOpacity
      style={styles.icon}
      activeOpacity={0.8}
      onPress={() => navigation.navigate('Alarm')}>
      {isUnConfirmAlarm === 'true' && (
        <View style={styles.alarmConfirmWrapper} />
      )}
      <AlertSvg width={24} height={24} />
    </TouchableOpacity>
  );
};

type NavigationProp = StackNavigationProp<RootStackParamList>;
const RightItems = ({name}: {name: string}) => {
  const navigation = useNavigation<NavigationProp>();
  const {userData, gotoProfile, setUserDataByKey} = useUserStore();
  const {handleAllConfirmAlarm} = useNotificationStore();

  const updatePiggy = async () => {
    if (userData) {
      const data = await getPiggySpb(userData.id);

      if (data) {
        const piggy = data.latest_piggy_count;
        setUserDataByKey('piggy', piggy);
      }
    }
  };

  useFocusEffect(
    useCallback(() => {
      updatePiggy();
    }, []),
  );

  switch (name) {
    case 'Home':
      return (
        <View style={styles.iconContainer}>
          <TouchableOpacity
            style={styles.icon}
            onPress={() => navigation.navigate('GiftFriend')}>
            <GiftSvg style={styles.svg} />
          </TouchableOpacity>
          <Alarm />
        </View>
      );
    case 'Friends':
      return (
        <View style={styles.iconContainer}>
          <TouchableOpacity
            style={styles.icon}
            onPress={() =>
              navigation.navigate('FriendSearch', {
                previousScreen: 'Friends',
              })
            }>
            <SearchSvg style={styles.svg} />
          </TouchableOpacity>
          <Alarm />
        </View>
      );
    case 'Goods':
    case 'GoodsDetail':
      return (
        <View style={styles.iconContainer}>
          <View style={[styles.directionRow, styles.icon]}>
            <Text style={styles.text}>{userData.piggy}</Text>
            <Text style={[styles.text, styles.colorRed]}>P</Text>
          </View>
          <Alarm />
        </View>
      );
    case 'Settings':
      return (
        <View style={styles.iconContainer}>
          <TouchableOpacity style={styles.icon} onPress={gotoProfile}>
            <EditSvg style={styles.svg} />
          </TouchableOpacity>
          <Alarm />
        </View>
      );
    case 'Alarm':
      return (
        <TouchableOpacity
          style={{padding: 8}}
          onPress={() => handleAllConfirmAlarm()}>
          <Text style={commonStyle.MEDIUM_33_16}>모두 읽음</Text>
        </TouchableOpacity>
      );
    default:
      return <Alarm />;
  }
};

const TopTab = ({route, options}: BottomTabHeaderProps | StackHeaderProps) => {
  return (
    <SafeAreaView style={{backgroundColor: '#FFF'}}>
      <View style={styles.container}>
        <LeftItem
          name={route.name}
          headerLeftLabelVisible={options?.headerLeftLabelVisible || false}
        />
        <Title title={options.title || ''} />
        <RightItems name={route.name} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    height: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  logo: {
    height: 32,
    width: 80,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    padding: 8,
    color: '#555',
  },
  text: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'medium',
    fontFamily: 'NotoSansKR-Medium',
    lineHeight: 24,
  },
  colorRed: {
    color: '#ED423F',
  },
  directionRow: {
    flexDirection: 'row',
  },
  empty: {
    width: 48,
  },
  button: {
    padding: 8,
    margin: -8,
  },
  svg: {
    width: 24,
    height: 24,
    color: '#555',
  },
  alarmConfirmWrapper: {
    position: 'absolute',
    zIndex: 2,
    top: 6,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 10,
    backgroundColor: '#04BF8A',
  },
});
export default TopTab;
