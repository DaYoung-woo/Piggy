import React, {useEffect, useState} from 'react';
import {View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import dayjs from 'dayjs';
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
import {getPiggySpb} from '@/supabase/AuthSpb';
import AppointmentActionsButton from './AppointmentActionsButton';
import {Participant, CancelStatus} from '@/types/appointment';

const AppointmentDetail = () => {
  const addToast = useToastStore(state => state.addToast);
  const {userData, setUserDataByKey} = useUserStore();
  const {appointmentForm} = useAppointmentForm();
  const [cancelStatus, setCancelStatus] = useState<CancelStatus>('nothing');
  const [myAgreementStatus, setMyAgreementStatus] = useState(''); // 약속 동의 상태
  const [isNearAppointment, setIsNearAppointment] = useState(''); // 약속까지 남은 시간 ('10min', '2hr', 'expired', '')
  const [certification, setCertification] = useState(false); // 도착 인증 상태
  const [myPiggy, setMyPiggy] = useState<number>(0);
  const {location} = useLocation();
  const navigation = useNavigation();

  useEffect(() => {
    getAppointmentCancellationStatus();
    fetchCertification();
    checkAppointmentTime();
    fetchAcceptance();
    fetchPiggyData();
  }, [appointmentForm]);

  const fetchPiggyData = async () => {
    const res = await getPiggySpb(userData.id);
    setMyPiggy(res?.latest_piggy_count);
    setUserDataByKey('piggy', res?.latest_piggy_count);
  };

  // 나의 약속 수락 상태 확인
  const fetchAcceptance = async () => {
    const res = await getAppointmentParticipantsSpb(
      userData.id,
      appointmentForm.id,
    );
    const myData = (res.data as Participant[]).filter(
      item => item.nickname === userData.nickname,
    );
    setMyAgreementStatus(myData[0]?.agreement_status || '');
  };

  const fetchCertification = async () => {
    try {
      const res = await getCertificationStatusSpb(
        userData.id,
        appointmentForm.id,
      );
      if (res) {
        setCertification(res?.data[0]?.certification_status || false);
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
    if (!appointmentForm?.date || !appointmentForm?.time) {
      return;
    }

    const appointmentTime = dayjs(
      `${appointmentForm.date} ${appointmentForm.time}`,
      'YYYY-MM-DD HH:mm',
    );
    const currentTime = dayjs();
    const twoHoursBefore = appointmentTime.subtract(2, 'hour');
    const tenMinutesBefore = appointmentTime.subtract(10, 'minute');

    if (currentTime.isAfter(appointmentTime)) {
      // 약속 시간이 지났을 경우
      setIsNearAppointment('expired');
    } else if (
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
      setIsNearAppointment('');
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

      await setCertificationStatusSpb(
        userData.id,
        appointmentForm.id,
        appointmentForm.latitude,
        appointmentForm.longitude,
        userLat,
        userLon,
      );
      addToast({
        success: true,
        text: '약속 인증을 완료했어요!',
      });
      navigation.goBack();
    } catch (err) {
      addToast({
        success: false,
        text: err.message || '약속 인증에 실패했어요.',
      });
    }
  };

  // 약속 취소 상태 확인
  const getAppointmentCancellationStatus = async () => {
    try {
      const res = await getAppointmentCancellationStatusSpb(
        userData.id,
        appointmentForm.id,
      );
      if (res?.[0]?.cancellation_status) {
        setCancelStatus(res?.[0]?.cancellation_status);
      } else {
        // 동시 취소 요청 방지를 위해 반환
        return 'nothing';
      }
    } catch {
      addToast({
        success: false,
        text: '약속 정보를 불러오는데 실패했어요.',
      });
      return '';
    }
  };

  const cancelAppointment = async () => {
    try {
      // 버튼을 눌렀을 때 최신 취소 상태 호출
      const currentCancelStatus = await getAppointmentCancellationStatus();

      // 최신 상태를 바탕으로 취소 요청 진행
      if (currentCancelStatus === 'nothing') {
        await setAppointmentCancellationSpb(userData.id, appointmentForm.id);
        addToast({
          success: true,
          text: '약속 취소 요청을 보냈어요.',
        });
        navigation.goBack();
      } else {
        addToast({
          success: false,
          text: '앗, 조금 전 취소 요청이 들어왔어요!',
          multiText: '약속 상태를 확인하세요!',
        });
        return;
      }
    } catch {
      addToast({
        success: false,
        text: '약속 취소 요청에 실패했어요.',
      });
    }
  };

  const setAppointmentCancellationAcceptance = async (type: string) => {
    try {
      await setAppointmentCancellationAcceptanceSpb(
        userData.id,
        appointmentForm.id,
        type,
      );
      addToast({
        success: true,
        text: '약속 취소 요청 응답에 성공했어요.',
      });
    } catch {
      addToast({
        success: false,
        text: '약속 취소 요청 응답에 실패했어요.',
        multiText: '다시 시도해주세요.',
      });
    }
  };

  // 취소 수락 확인
  const setAppointmentAcceptance = async (type: boolean) => {
    try {
      // 내 피기 보다 약속 피기가 많을 경우 실패 토스트
      if (type === true && appointmentForm.deal_piggy_count > myPiggy) {
        addToast({
          success: false,
          text: '피기가 부족해 약속 수락이 불가능합니다.',
          multiText: '소유한 피기를 확인해주세요!',
        });
        return;
      } else {
        await setAppointmentAcceptanceSpb(
          userData.id,
          appointmentForm.id,
          type,
        );
        addToast({
          success: true,
          text: `약속을 ${type ? '수락' : '거절'}했어요.`,
        });
        navigation.goBack();
      }
    } catch {
      addToast({
        success: false,
        text: `약속 ${type ? '수락' : '거절'}에 실패했어요.`,
      });
    }
  };

  return (
    <View style={commonStyle.CONTAINER}>
      <AppointmentActionsButton
        appointmentForm={appointmentForm}
        cancelStatus={cancelStatus}
        myAgreementStatus={myAgreementStatus}
        isNearAppointment={isNearAppointment}
        certification={certification}
        appointmentTimeCheck={`${appointmentForm.date}T${appointmentForm.time}:00`}
        handleCertification={handleCertification}
        cancelAppointment={cancelAppointment}
        setAppointmentCancellationAcceptance={
          setAppointmentCancellationAcceptance
        }
        setAppointmentAcceptance={setAppointmentAcceptance}
      />
    </View>
  );
};

export default AppointmentDetail;
