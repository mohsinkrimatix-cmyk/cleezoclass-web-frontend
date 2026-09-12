import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ErrorContext } from '../ErrorContext';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'ParentFees'>;
type FeesViewProps = Props & { embedded?: boolean };

const formatINR = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(value);

const toNumber = (value: any) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatFeeLabel = (key: string) =>
  key === 'Calculated_Tuition_Fee'
    ? 'Tuition Fee'
    : key === 'CompleteFee'
      ? 'Total Fee'
      : key
          .replace(/[_-]+/g, ' ')
          .replace(/([a-z])([A-Z])/g, '$1 $2')
          .replace(/\b\w/g, (char) => char.toUpperCase())
          .replace(/\bFees\b/g, 'Fee')
          .trim();

const RESERVED_FEE_KEYS = new Set([
  'id',
  'studentId',
  'student_id',
  'username',
  'name',
  'class_name',
  'section',
  'schoolCode',
  'FeeClass',
  'FeeSection',
  'Class_name',
  'StudentName',
  'login_id',
  'receiptNumber',
  'receipt_number',
  'paidDate',
  'paymentMode',
  'transaction_id',
  'status',
  'fee_type',
  'discount_reason',
  'fee_discount',
  'tuition_discount',
  'Previous_Paid',
  'Previous_Fee_Due',
  'amount_paid',
  'UploadFeeDetails',
  'UpdatedCompleteFee',
  'CompleteFee',
  'Final_Amount',
  'Paid_Amount',
  'Discount',
  'Admission_paid',
  'books_paid',
  'uniform_paid',
  'bus_paid',
  'exam_paid',
  'others_paid',
  'Admission_Discount',
  'books_discount',
  'uniform_discount',
  'bus_discount',
  'exam_discount',
  'others_discount',
  'ResidentialCompleteFee',
  'feeDetails',
  'feeDetail',
  'createdAt',
  'updatedAt',
]);

const getFirstNumericValue = (source: Record<string, any>, keys: string[]) => {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const value = toNumber(source[key]);
      if (value || source[key] === 0) return value;
    }
  }
  return 0;
};

const normalizeClassName = (value: string) => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  if (/^class\s+/i.test(trimmed)) return trimmed;
  return `Class ${trimmed}`;
};

const buildDynamicFeeRows = (
  classFeeData: Record<string, any> | null,
  studentFeeData: Record<string, any> | null
) => {
  const baseFeeData = classFeeData || {};
  const paymentFeeData = studentFeeData || {};
  if (!Object.keys(baseFeeData).length && !Object.keys(paymentFeeData).length) return [];

  const rows: Array<{
    key: string;
    label: string;
    amount: number;
    paid: number;
    discount: number;
    due: number;
  }> = [];
  const consumedKeys = new Set<string>();

  Object.keys(baseFeeData).forEach((key) => {
    if (consumedKeys.has(key) || RESERVED_FEE_KEYS.has(key)) return;
    if (/_paid$|_due$|_discount$/i.test(key)) return;

    const amount = toNumber(baseFeeData[key]);
    const paidKeyCandidates = [
      `${key}_paid`,
      `${key}_Paid`,
      `${key.replace(/fees?/i, '')}_paid`,
      `${key.replace(/fees?/i, '')}Paid`,
    ];
    if (key === 'Tuition_Fee' || key === 'Calculated_Tuition_Fee') {
      paidKeyCandidates.unshift('Paid_Amount', 'tuition_paid', 'fee_paid');
    }
    if (key === 'Admission_fees' || key === 'Admission_Fee') {
      paidKeyCandidates.unshift('Admission_paid');
    }
    const paid = getFirstNumericValue(paymentFeeData, paidKeyCandidates);

    const discountKeyCandidates = [
      `${key}_discount`,
      `${key}_Discount`,
      `${key}_discount`,
      `${key}_Discount`,
      `${key.replace(/fees?/i, '')}_discount`,
      `${key.replace(/fees?/i, '')}Discount`,
    ];
    if (key === 'Tuition_Fee' || key === 'Calculated_Tuition_Fee') {
      discountKeyCandidates.unshift('Discount', 'tuition_discount', 'fee_discount');
    }
    if (key === 'Admission_fees' || key === 'Admission_Fee') {
      discountKeyCandidates.unshift('Admission_Discount');
    }
    const discount = getFirstNumericValue(paymentFeeData, discountKeyCandidates) || getFirstNumericValue(baseFeeData, [
      `${key}_discount`,
      `${key}_Discount`,
      `${key.replace(/fees?/i, '')}_discount`,
      `${key.replace(/fees?/i, '')}Discount`,
    ]);
    const looksLikeFeeField = /fee|fees|amount|charge|others|saving|residential/i.test(key);

    if (!looksLikeFeeField && !amount && !paid && !discount) return;
    if (!amount && !paid && !discount) return;

    const normalizedAmount = amount || paid;

    rows.push({
      key,
      label: formatFeeLabel(key),
      amount: normalizedAmount,
      paid,
      discount,
      due: Math.max(normalizedAmount - paid - discount, 0),
    });
  });

  return rows;
};

const ParentFees: React.FC<FeesViewProps> = ({ navigation, embedded = false }) => {
  const [studentData, setStudentData] = useState<Record<string, any> | null>(null);
  const [fees, setFees] = useState<Record<string, any> | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const { showError } = React.useContext(ErrorContext);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const keys = ['studentId', 'username', 'name', 'class_name', 'section', 'schoolCode'];
        const stores = await AsyncStorage.multiGet(keys);
        const data: Record<string, any> = {};
        stores.forEach(([key, value]) => {
          if (value) data[key] = value;
        });
        console.log('[ParentFees] AsyncStorage student data:', data);
        setStudentData(data);
      } catch {
        console.log('[ParentFees] Failed to load student data from AsyncStorage');
        showError('Data Error', 'Failed to load student information.');
      }
    };

    fetchStudentData();
  }, [showError]);

  useEffect(() => {
    let active = true;

    const fetchFees = async () => {
      try {
        if (!studentData?.class_name || !studentData?.section || !studentData?.schoolCode) return;
        console.log('[ParentFees] fetchFees studentData:', studentData);

        const classFeeUrl = `https://cleezoclass.com:4000/feeStructure/${encodeURIComponent(
          normalizeClassName(studentData.class_name)
        )}?schoolCode=${encodeURIComponent(studentData.schoolCode)}&section=${encodeURIComponent(
          studentData.section
        )}`;

        const [classRes, studentRes] = await Promise.allSettled([
          axios.get(classFeeUrl),
          axios.post('https://cleezoclass.com:4000/api/studentFees', {
            studentId: studentData.studentId,
            schoolCode: studentData.schoolCode,
          }),
        ]);

        if (!active) return;

        const classFeeData = classRes.status === 'fulfilled' ? classRes.value.data?.feeStructure || {} : {};
        const studentFeeData = studentRes.status === 'fulfilled' ? studentRes.value.data?.feeDetails || {} : {};

        console.log('[ParentFees] classRes status:', classRes.status);
        console.log('[ParentFees] studentRes status:', studentRes.status);
        console.log('[ParentFees] classFeeData:', classFeeData);
        console.log('[ParentFees] studentFeeData:', studentFeeData);

        setFees({
          ...classFeeData,
          ...studentFeeData,
        });
      } catch {
        if (active) {
          showError('Fee Load Error', 'Unable to load fee details.');
          setFees(null);
        }
      }
    };

    const fetchPaymentDetails = async () => {
      try {
        if (!studentData?.studentId || !studentData?.schoolCode) return;
        const paymentApiUrl = `https://cleezoclass.com:4000/api/payment/${studentData.studentId}?schoolCode=${studentData.schoolCode}`;
        console.log('[ParentFees] paymentDetails API:', paymentApiUrl);
        console.log('[ParentFees] paymentDetails payload:', {
          studentId: studentData.studentId,
          schoolCode: studentData.schoolCode,
        });
        const res = await axios.get(
          paymentApiUrl
        );
        if (!active) return;
        console.log('[ParentFees] payment response:', res?.data?.payments || {});
        setPaymentDetails(res?.data?.payments || {});
      } catch {
        if (active) setPaymentDetails(null);
      }
    };

    const run = async () => {
      setLoading(true);
      await Promise.all([fetchFees(), fetchPaymentDetails()]);
      if (active) setLoading(false);
    };

    run();
    return () => {
      active = false;
    };
  }, [studentData?.class_name, studentData?.section, studentData?.schoolCode, studentData?.studentId, showError]);

  if (loading || !studentData) {
    return (
      <View style={embedded ? styles.embeddedShell : styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#111" />
          <Text style={styles.loadingText}>Loading fee data...</Text>
        </View>
      </View>
    );
  }

  if (!fees) {
    return (
      <View style={embedded ? styles.embeddedShell : styles.safeArea}>
        <View style={styles.center}>
          <Text style={styles.emptyText}>No fee data available.</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack?.()}>
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const finalAmount = Number(fees?.Final_Amount ?? fees?.CompleteFee ?? 0);
  const totalPaid =
    Number(fees?.Paid_Amount ?? 0) +
    Number(fees?.Admission_paid ?? 0) +
    Number(fees?.books_paid ?? 0) +
    Number(fees?.uniform_paid ?? 0) +
    Number(fees?.bus_paid ?? 0) +
    Number(fees?.exam_paid ?? 0) +
    Number(fees?.others_paid ?? 0);
  const feeRows = buildDynamicFeeRows(fees);
  const totalDiscount = feeRows.reduce((sum, row) => sum + row.discount, 0);
  const totalPaidAmount = feeRows.reduce((sum, row) => sum + row.paid, 0) || totalPaid;
  const totalDue = Math.max(finalAmount - totalPaidAmount, 0);

  console.log('[ParentFees] computed totals:', {
    finalAmount,
    totalPaid,
    totalDue,
    fees,
  });

  const installments = [1, 2, 3, 4, 5]
    .map((i) => ({
      label: `Installment ${i}`,
      total: Number(fees[`Installment${i}_Amount`] || 0),
      paid: Number(fees[`Installment${i}_Paid`] || 0),
      deadline: fees[`Installment${i}_Deadline_Date`] || '-',
      paidDate: fees[`Installment${i}_PaidDate`] || '-',
    }))
    .filter((item) => item.total > 0);

  console.log('[ParentFees] installments:', installments);

  const content = (
    <View style={embedded ? styles.embeddedContent : styles.content}>
      <StatusBar barStyle="dark-content" />
      {!embedded ? (
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Fees</Text>
            <Text style={styles.subtitle}>{studentData?.name || '-'} {studentData?.class_name || ''}</Text>
          </View>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack?.()}>
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.embeddedHeader}>
          <Text style={styles.embeddedTitle}>Fees</Text>
          <Text style={styles.subtitle}>{studentData?.name || '-'} {studentData?.class_name || ''}</Text>
        </View>
      )}

      <View style={embedded ? styles.embeddedSummaryCard : styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryBlock}>
            <Text style={styles.summaryLabel}>Total Fee</Text>
            <Text style={styles.amount}>{formatINR(finalAmount)}</Text>
          </View>
          <View style={styles.summaryBlock}>
            <Text style={styles.summaryLabel}>Paid</Text>
            <Text style={styles.amount}>{formatINR(totalPaidAmount)}</Text>
          </View>
          <View style={styles.summaryBlock}>
            <Text style={styles.summaryLabel}>Discount</Text>
            <Text style={styles.amount}>{formatINR(totalDiscount)}</Text>
          </View>
        </View>
        <View style={styles.duePill}>
          <Text style={styles.dueText}>Due: {formatINR(totalDue)}</Text>
        </View>
      </View>

      <View style={styles.scrollArea}>
        <ScrollView
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={embedded ? styles.embeddedSectionCard : styles.sectionCard}>
            <Text style={styles.sectionTitle}>Fee Breakdown</Text>
            {feeRows.length === 0 ? (
              <Text style={styles.emptyText}>No fee breakdown available.</Text>
            ) : (
              feeRows.map((row) => (
                <View key={row.key} style={styles.feeCard}>
                  <View style={styles.feeCardHeader}>
                    <Text style={styles.feeCardTitle}>{row.label}</Text>
                    <Text style={styles.feeCardAmount}>{formatINR(row.amount)}</Text>
                  </View>
                  <View style={styles.feeMetaRow}>
                    <Text style={styles.feeMetaLabel}>Paid</Text>
                    <Text style={styles.feeMetaValue}>{formatINR(row.paid)}</Text>
                  </View>
                  <View style={styles.feeMetaRow}>
                    <Text style={styles.feeMetaLabel}>Discount</Text>
                    <Text style={styles.feeMetaValue}>{formatINR(row.discount)}</Text>
                  </View>
                  <View style={styles.feeMetaRow}>
                    <Text style={styles.feeMetaLabel}>Due</Text>
                    <Text style={styles.feeMetaValue}>{formatINR(row.due)}</Text>
                  </View>
                </View>
              ))
            )}
          </View>

          <View style={embedded ? styles.embeddedSectionCard : styles.sectionCard}>
            <Text style={styles.sectionTitle}>Installments</Text>
            {installments.length === 0 ? (
              <Text style={styles.emptyText}>No installment data available.</Text>
            ) : (
              installments.map((item) => (
                <View key={item.label} style={styles.installmentCard}>
                  <View style={styles.installmentTopRow}>
                    <Text style={styles.installmentTitle}>{item.label}</Text>
                    <Text style={styles.installmentAmount}>{formatINR(item.total)}</Text>
                  </View>
                  <Text style={styles.installmentText}>Paid: {formatINR(item.paid)}</Text>
                  <Text style={styles.installmentText}>Deadline: {String(item.deadline)}</Text>
                  <Text style={styles.installmentText}>Paid Date: {String(item.paidDate)}</Text>
                </View>
              ))
            )}
          </View>

          <View style={embedded ? styles.embeddedSectionCard : styles.sectionCard}>
            <Text style={styles.sectionTitle}>Payment Details</Text>
            {paymentDetails && Object.keys(paymentDetails).length > 0 ? (
              Object.entries(paymentDetails).map(([key, value]) => (
                <View key={key} style={styles.lineRow}>
                  <Text style={styles.lineLabel}>{key}</Text>
                  <Text style={styles.lineValue}>{String(value)}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No payment history available.</Text>
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );

  return embedded ? <View style={styles.embeddedCard}>{content}</View> : (
    <SafeAreaView style={styles.safeArea}>
      {content}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F6F6F7' },
  content: { flex: 1, padding: 16, paddingBottom: 28 },
  embeddedContent: { flex: 1, paddingHorizontal: 0, paddingTop: 0, paddingBottom: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '800', color: '#111' },
  subtitle: { marginTop: 4, fontSize: 13, color: '#666' },
  backBtn: { backgroundColor: '#404040', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  backBtnText: { color: '#fff', fontWeight: '700' },
  summaryCard: {
    backgroundColor: '#f6f6f7',
    borderRadius: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e7',
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    padding: 18,
    marginBottom: 16,
  },
  embeddedSummaryCard: {
    padding: 10,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryBlock: { flex: 1 },
  summaryLabel: { fontSize: 12, color: '#666', fontWeight: '700' },
  amount: { fontSize: 22, fontWeight: '800', color: '#111', marginTop: 6 },
  duePill: { marginTop: 14, backgroundColor: '#FFF2B3', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12, alignSelf: 'flex-start' },
  dueText: { fontSize: 14, fontWeight: '800', color: '#111' },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 12,
  },
  sectionCard: {
    backgroundColor: '#f6f6f7',
    borderRadius: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e7',
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    padding: 14,
    marginBottom: 12,
  },
  embeddedSectionCard: {
    padding: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#111', marginBottom: 12 },
  lineRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#eee' },
  lineLabel: { fontSize: 13, color: '#333', fontWeight: '600' },
  lineValue: { fontSize: 13, color: '#111', fontWeight: '700' },
  feeCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e7',
    padding: 12,
    marginBottom: 10,
  },
  feeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  feeCardTitle: { fontSize: 14, fontWeight: '800', color: '#111' },
  feeCardAmount: { fontSize: 14, fontWeight: '800', color: '#111' },
  feeMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  feeMetaLabel: { fontSize: 12, color: '#666', fontWeight: '600' },
  feeMetaValue: { fontSize: 12, color: '#111', fontWeight: '700' },
  installmentCard: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e7',
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#FAFAFA',
  },
  installmentTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  installmentTitle: { fontSize: 14, fontWeight: '800', color: '#111' },
  installmentAmount: { fontSize: 14, fontWeight: '800', color: '#111' },
  installmentText: { fontSize: 12, color: '#555', marginTop: 2 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 10, color: '#555' },
  emptyText: { textAlign: 'center', color: '#666', marginTop: 6 },
  embeddedShell: { padding: 0 },
  embeddedHeader: { marginBottom: 12 },
  embeddedTitle: { fontSize: 22, fontWeight: '800', color: '#111' },
  embeddedCard: { marginHorizontal: 0 },
});

export default ParentFees;
