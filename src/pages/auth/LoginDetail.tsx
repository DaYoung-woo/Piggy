import React, {useState} from 'react';
import {useNavigation} from '@react-navigation/native';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useToastStore, useUserStore} from '@/store/store';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '@/types/Router';
import {commonStyle} from '@/styles/common';
import Button from '@/components/common/Button';
import LoginDetailForm from './LoginDetailForm';
import CheckBox from '@/components/common/CheckBox';
import RightArrowSvg from '@/assets/icons/rightArrow.svg';

const logo = require('@/assets/icons/topLogo.png');

const LoginDetail = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const {userData, setIsAgree} = useUserStore();
  const addToast = useToastStore(state => state.addToast);
  const [isAgreeService, setIsAgreeService] = useState(
    userData?.isAgree.service || false,
  );
  const [isAgreePayment, setIsAgreePayment] = useState(
    userData?.isAgree.payment || false,
  );

  const handleAgreeToast = () =>
    addToast({
      success: false,
      text: '약관 미동의',
      multiText: '모든 필수 약관에 동의해주세요',
    });

  const gotoServiceAgreement = () => {
    navigation.navigate('ServiceAgreement');
  };

  const gotoPaymentAgreement = () => {
    navigation.navigate('PaymentAgreement');
  };

  const gotoHome = () => {
    if (!isAgreeService || !isAgreePayment) {
      handleAgreeToast();
      return;
    }
    navigation.replace('Main', {screen: 'Home'});
  };

  const hadnleAgreeService = () => {
    // service 동의 여부 토글
    setIsAgree('service');
  };

  const handleAgreePayment = () => {
    // payment 동의 여부 토글
    setIsAgree('payment');
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#FFF'}}>
      <ScrollView style={styles.container}>
        <Image source={logo} style={styles.logoContainer} alt="logo" />

        <View style={styles.introContainer}>
          <Text style={commonStyle.BOLD_33_24}>시작하기</Text>
          <Text style={commonStyle.REGULAR_AA_16}>
            간단한 정보 입력으로 피기를 시작하세요!
          </Text>
        </View>
        <View style={{gap: 16}}>
          <LoginDetailForm />
          <View style={styles.checkBoxContainer}>
            <CheckBox
              isChecked={isAgreeService}
              setIsChecked={setIsAgreeService}
              onPress={() => hadnleAgreeService()}
            />
            <TouchableOpacity
              onPress={() => gotoServiceAgreement()}
              activeOpacity={0.8}
              style={{flexGrow: 1, paddingVertical: 6}}>
              <Text style={{...commonStyle.REGULAR_33_14}}>
                Piggy 서비스 이용약관(필수)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => gotoServiceAgreement()}
              activeOpacity={0.8}
              style={styles.rightArrowIconContainer}>
              <RightArrowSvg />
            </TouchableOpacity>
          </View>
          <View style={styles.checkBoxContainer}>
            <CheckBox
              isChecked={isAgreePayment}
              setIsChecked={setIsAgreePayment}
              onPress={() => handleAgreePayment()}
            />
            <TouchableOpacity
              onPress={() => gotoPaymentAgreement()}
              activeOpacity={0.8}
              style={{flexGrow: 1, paddingVertical: 6}}>
              <Text style={{...commonStyle.REGULAR_33_14}}>
                Piggy 결제 이용약관(필수)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => gotoPaymentAgreement()}
              activeOpacity={0.8}
              style={styles.rightArrowIconContainer}>
              <RightArrowSvg />
            </TouchableOpacity>
          </View>

          <View style={{marginTop: 60}}>
            <Button text="시작하기" onPress={gotoHome} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 36,
    backgroundColor: '#FFF',
  },
  logoContainer: {
    height: 32,
    width: 80,
    marginLeft: -24,
    marginVertical: 8,
  },
  introContainer: {
    marginVertical: 42,
    alignItems: 'center',
    gap: 12,
  },
  checkBoxContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  rightArrowIconContainer: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LoginDetail;
