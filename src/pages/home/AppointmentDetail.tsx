import React, {useEffect, useState} from 'react';
import {View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import dayjs from 'dayjs';
import AppointmentCheck from '@/components/appointment/AppointmentCheck';
import Button from '@/components/common/Button';
import ButtonCouple from '@/components/common/ButtonCouple';
import {useLocation} from '@/hooks/useLocation';
import {useAppointmentForm, useToastStore, useUserStore} from '@/store/store';
import {commonStyle} from '@/styles/common';
import {
  getAppointmentCancellationStatusSpb,
  setAppointmentAcceptanceSpb,
  setAppointmentCancellationAcceptanceSpb,
  setAppointmentCancellationSpb,
  setCertificationStatusSpb,
  getCertificationStatusSpb,
  getAppointmentParticipantsSpb,
} from '@/supabase/appointmentSpb';

const AppointmentDetail = () => {
  const addToast = useToastStore(state => state.addToast);
  const {userData} = useUserStore();
  const {appointmentForm} = useAppointmentForm();
  const [cancelStatus, setCancelStatus] = useState('nothing');
  const [myAgreementStatus, setMyAgreementStatus] = useState();
  const [isNearAppointment, setIsNearAppointment] = useState('');
  const [certification, setCertification] = useState(false);
  const {location} = useLocation();
  const navigation = useNavigation();

  useEffect(() => {
    getAppointmentCancellationStatus();
    fetchCertification();
    checkAppointmentTime();
    fetchAcceptance();
    console.log('상태 확인', certification);
  }, [appointmentForm]);

  // 나의 약속 수락 상태 확인
  const fetchAcceptance = async () => {
    const res = await getAppointmentParticipantsSpb(
      userData.id,
      appointmentForm.id,
    );

    const myData = res.data.filter(item => item.nickname === userData.nickname);
    setMyAgreementStatus(myData[0].agreement_status);
  };

  // 약속 인증 상태 확인
  const fetchCertification = async () => {
    try {
      const res = await getCertificationStatusSpb(
        userData.id,
        appointmentForm.id,
      );

      if (res) {
        setCertification(res?.data[0].certification_status);
      } else {
        addToast({
          success: false,
          text: '위치 정보를 가져올 수 없습니다.',
          multiText: '네트워크 연결을 확인해주세요.',
        });
        throw new Error('인증 상태를 가져오는 데 실패했습니다.');
      }
    } catch (err) {
      throw new Error(`인증 상태 불러오기 실패: ${err.message}`);
    }
  };

  // 약속 2시간 & 10분 전인지 확인
  const checkAppointmentTime = () => {
    if (!appointmentForm?.date || !appointmentForm?.time) return;

    const appointmentTime = dayjs(
      `${appointmentForm.date} ${appointmentForm.time}`,
      'YYYY-MM-DD HH:mm',
    );
    const currentTime = dayjs();
    const twoHoursBefore = appointmentTime.subtract(2, 'hour');
    const tenMinutesBefore = appointmentTime.subtract(10, 'minute');

    if (
      currentTime.isAfter(tenMinutesBefore) &&
      currentTime.isBefore(appointmentTime)
    ) {
      setIsNearAppointment('10min');
    } else if (
      currentTime.isAfter(twoHoursBefore) &&
      currentTime.isBefore(tenMinutesBefore)
    ) {
      setIsNearAppointment('2hr');
    } else {
      setIsNearAppointment(false);
    }
  };

  // 도착 인증 요청
  const handleCertification = async () => {
    if (!location) {
      addToast({
        success: false,
        text: '위치 정보를 가져올 수 없습니다.',
        multiText: '네트워크 연결을 확인해주세요.',
      });
      return;
    }
    try {
      const {latitude: userLat, longitude: userLon} = location; // 사용자 위치 좌표

      const radius = 0.15; // 인증 범위(km) - 현재 인증 반경 150m
      await setCertificationStatusSpb(
        userData.id,
        appointmentForm.id,
        appointmentForm.latitude,
        appointmentForm.longitude,
        userLat,
        userLon,
        radius,
      );
      addToast({
        success: true,
        text: '약속 인증을 완료했어요!',
      });
      navigation.goBack();
    } catch {
      addToast({
        success: false,
        text: '약속 인증에 실패했어요.',
      });
    }
  };

  // 약속 취소 요청 했는지 체크
  const getAppointmentCancellationStatus = async () => {
    try {
      const res = await getAppointmentCancellationStatusSpb(
        userData.id,
        appointmentForm.id,
      );
      console.log(res);
      if (res?.[0]?.cancellation_status) {
        setCancelStatus(res?.[0]?.cancellation_status);
      }
    } catch {
      addToast({
        success: false,
        text: '약속 정보를 불러오는데 실패했어요.',
      });
    }
  };

  // 약속 취소 요청
  const cancelAppointment = async () => {
    try {
      await setAppointmentCancellationSpb(userData.id, appointmentForm.id);
      addToast({
        success: true,
        text: '약속 취소 요청을 보냈어요.',
      });
      getAppointmentCancellationStatus();
    } catch (e) {
      addToast({
        success: false,
        text: '약속 취소 요청에 실패했어요.',
      });
    }
  };

  // 약속 취소 요청 응답
  const setAppointmentCancellationAcceptance = async type => {
    try {
      await setAppointmentCancellationAcceptanceSpb(
        userData.id,
        appointmentForm.id,
        type,
      );
    } catch {
      addToast({
        success: false,
        text: '약속 취소 요청에 수락/거절에 실패했어요.',
      });
    }
  };

  // 약속 수락/거절
  const setAppointmentAcceptance = async type => {
    try {
      await setAppointmentAcceptanceSpb(userData.id, appointmentForm.id, type);
      addToast({
        success: true,
        text: `약속을 ${type ? '수락' : '거절'}했어요.`,
      });
      navigation.goBack();
    } catch {
      addToast({
        success: false,
        text: `약속 ${type ? '수락' : '거절'}에 실패했어요.`,
      });
    }
  };

  // nothing일 때 버튼 변경 함수
  const getButtonProps = () => {
    if (certification) {
      return {text: '인증 완료', onPress: handleCertification, disabled: true};
    }

    switch (isNearAppointment) {
      case '10min':
        return {
          text: '약속 인증',
          onPress: handleCertification,
          disabled: false,
        };
      case '2hr':
        return {
          text: '약속 인증',
          onPress: handleCertification,
          disabled: true,
        };
      default:
        return {text: '취소 요청', onPress: cancelAppointment, disabled: false};
    }
  };

  const btn = () => {
    if (
      appointmentForm.appointment_status === 'expired' ||
      appointmentForm.appointment_status === 'fulfilled'
    ) {
      return;
    }

    if (appointmentForm.appointment_status === 'pending') {
      return myAgreementStatus === 'confirmed' ? (
        <Button text={'수락 완료'} onPress={() => {}} disable={true} />
      ) : (
        <ButtonCouple
          onPressLeft={() => {
            setAppointmentAcceptance(false);
          }}
          onPressRight={() => {
            setAppointmentAcceptance(true);
          }}
          textLeft={'약속 거절'}
          textRight={'약속 수락'}
          theme="outline"
        />
      );
    }

    if (cancelStatus === 'nothing') {
      const {text, onPress, disabled} = getButtonProps();
      return <Button text={text} onPress={onPress} disable={disabled} />;
    }

    if (cancelStatus === 'cancellation-request') {
      return (
        <Button
          text={'취소 요청 완료'}
          onPress={cancelAppointment}
          disable={true}
        />
      );
    }

    if (cancelStatus === 'cancellation-rejected') {
      return <Button text={'취소 거절'} disable={true} />;
    }

    if (cancelStatus === 'cancellation-confirm') {
      return <Button text={'취소 완료'} disable={true} />;
    }

    if (cancelStatus === 'cancellation-pending') {
      return (
        <ButtonCouple
          onPressLeft={() => {
            setAppointmentCancellationAcceptance('cancellation-rejected');
          }}
          onPressRight={() => {
            setAppointmentCancellationAcceptance('cancellation-confirmed');
          }}
          textLeft={'취소 거절'}
          textRight={'취소 수락'}
          theme="outline"
        />
      );
    }
  };

  return (
    <View style={commonStyle.CONTAINER}>
      <AppointmentCheck>{btn()}</AppointmentCheck>
    </View>
  );
};

export default AppointmentDetail;
