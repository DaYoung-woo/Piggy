import {useCallback, useState} from 'react';
import {useAppointmentForm, useUserStore, useToastStore} from '@/store/store';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {
  setAppointmentParticipantsSpb,
  setAppointmentProposerSpb,
  setAppointmentSpb,
} from '@/supabase/appointmentSpb';
import {changeDateText} from '@/utils/timePicker';
import {sendInviteNotificationAPI} from '@/api/fcm';
import {getPiggySpb} from '@/supabase/AuthSpb';

const useAppointmentFormHooks = () => {
  const [nowStep, setNowStep] = useState(1);
  const navigation = useNavigation();
  const addToast = useToastStore(state => state.addToast);
  const {appointmentForm, resetAppointmentForm} = useAppointmentForm();
  const {userData, setUserDataByKey} = useUserStore();
  const totalStep = 5;

  // 전역 상태 폼 reset
  useFocusEffect(
    useCallback(() => {
      resetAppointmentForm();
      getPiggy();
    }, []),
  );

  // 피기 정보 불러오기
  const getPiggy = async () => {
    const res = await getPiggySpb(userData.id);
    setUserDataByKey('piggy', res?.latest_piggy_count);
  };

  // 이전 버튼 클릭
  const handlePrevious = () => {
    setNowStep(prevStep => Math.max(prevStep - 1, 1));
  };

  // 다음 버튼 클릭
  const handleNext = () => {
    if (nowStep === 5) {
      handleAddAppointment();
    }
    setNowStep(prevStep => Math.min(prevStep + 1, totalStep));
  };

  // next 버튼 비활성화 여부
  const disable = () => {
    if (
      (!appointmentForm.subject ||
        !appointmentForm?.appointment_participants_list?.length) &&
      nowStep === 1
    ) {
      return true;
    }

    if (!appointmentForm.latitude && nowStep === 2) {
      return true;
    }

    if (!appointmentForm.date && nowStep === 3) {
      return true;
    }

    if (appointmentForm.deal_piggy_count > userData.piggy && nowStep === 4) {
      return true;
    }

    return false;
  };

  // 약속 생성
  const handleAddAppointment = async () => {
    try {
      if (
        !appointmentForm.appointment_participants_list ||
        !appointmentForm.subject
      ) {
        return;
      }
      const participants_uuid = [
        ...appointmentForm.appointment_participants_list.map(el => el.id),
        userData.id,
      ];
      const data = await addAppointment();
      await addAppointmentParticipants(data?.[0].id);
      await updateAppointmentProposer(userData.id, data?.[0].id);
      // 백 그라운드 알림(약속 초대)
      await sendInviteNotificationAPI(
        participants_uuid,
        appointmentForm.subject,
      );
      navigation.goBack();
      addToast({
        success: false,
        text: '약속을 생성했어요',
      });
    } catch {
      addToast({
        success: false,
        text: '약속 생성에 실패했어요',
      });
    }
  };

  // 약속 row 추가
  const addAppointment = async () => {
    const {
      subject,
      appointment_participants_list,
      address,
      place_name,
      latitude,
      longitude,
      deal_piggy_count,
      date,
      time,
    } = appointmentForm;
    const hour = changeDateText(time?.getHours() || 0);
    const minute = changeDateText(time?.getMinutes() || 0);
    const timeString = `${hour}:${minute}:00`;
    const {data, error} = await setAppointmentSpb({
      id: userData.id,
      subject,
      participant_count: (appointment_participants_list?.length || 0) + 1,
      address,
      place_name,
      latitude,
      longitude,
      appointment_date: `${String(date)} ${timeString}`,
      deal_piggy_count,
    });
    console.log(error);
    if (error) {
      throw Error;
    }
    return data;
  };

  // 약속 참석자 row 추가
  const addAppointmentParticipants = async (id: string) => {
    if (!appointmentForm.appointment_participants_list) {
      return;
    }

    const participants_uuid = [
      ...appointmentForm.appointment_participants_list.map(el => el.id),
      userData.id,
    ];

    const {data, error} = await setAppointmentParticipantsSpb(
      id,
      participants_uuid,
    );

    console.log(error);
    if (error) {
      throw Error;
    }
    return data;
  };

  // 약속 참석자 중 proporser 상태 변경
  const updateAppointmentProposer = async (
    userId: string,
    appointmentId: string,
  ) => {
    const {error} = await setAppointmentProposerSpb(userId, appointmentId);
    console.log(error);
    if (error) {
      throw Error;
    }
  };

  return {
    nowStep,
    totalStep,
    disable,
    handlePrevious,
    handleNext,
  };
};

export default useAppointmentFormHooks;
