import { StyleSheet } from '@react-pdf/renderer';

// สไตล์สำหรับใบประกาศนียบัตรสไตล์คอร์สออนไลน์ (Modern / Clean)
const certificateOnlineStyles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 36,
    fontFamily: 'THSarabunNew',
    fontSize: 16,
    lineHeight: 1.35,
  },
  headerBar: {
    height: 70,
    backgroundColor: '#0b3d91',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    color: '#ffffff'
  },
  headerLeft: {
    flexDirection: 'column'
  },
  brandTitle: {
    fontSize: 22,
    color: '#ffffff',
    fontWeight: 'bold'
  },
  brandSubtitle: {
    fontSize: 12,
    color: '#e2e8f0'
  },
  headerRightSeal: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#ffffff',
    border: '2px solid #0b3d91',
    alignItems: 'center',
    justifyContent: 'center'
  },
  sealText: {
    fontSize: 10,
    color: '#0b3d91',
    fontWeight: 'bold',
    textAlign: 'center'
  },
  titleSection: {
    marginTop: 28,
    alignItems: 'center',
    textAlign: 'center'
  },
  certTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#0b3d91',
    marginBottom: 4
  },
  certSubtitle: {
    fontSize: 14,
    color: '#334155'
  },
  recipientBox: {
    marginTop: 32,
    border: '1.5px solid #0b3d91',
    borderRadius: 10,
    padding: 20,
    backgroundColor: '#f8fafc'
  },
  label: {
    fontSize: 12,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  studentName: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 4
  },
  courseName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0b3d91',
    marginTop: 8,
    textAlign: 'center'
  },
  statement: {
    marginTop: 18,
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 1.4,
    color: '#1e293b'
  },
  achievementsBox: {
    marginTop: 20,
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    padding: 14,
    backgroundColor: '#ffffff'
  },
  achievementsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0b3d91',
    marginBottom: 6
  },
  achievementItem: {
    fontSize: 12,
    marginBottom: 3,
    color: '#334155'
  },
  evaluationSummary: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24
  },
  evalCard: {
    border: '1px solid #0b3d91',
    borderRadius: 8,
    padding: 10,
    width: 160,
    alignItems: 'center',
    backgroundColor: '#ffffff'
  },
  evalNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0b3d91',
    marginBottom: 4
  },
  evalLabel: {
    fontSize: 12,
    color: '#475569'
  },
  passBadge: {
    marginTop: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: '#16a34a',
    color: '#ffffff'
  },
  failBadge: {
    marginTop: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: '#dc2626',
    color: '#ffffff'
  },
  signaturesRow: {
    marginTop: 48,
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  signatureBlock: {
    width: '40%',
    alignItems: 'center'
  },
  signatureLine: {
    width: '100%',
    height: 1,
    backgroundColor: '#0f172a',
    marginBottom: 6
  },
  signerName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  signerTitle: {
    fontSize: 12,
    color: '#475569'
  },
  footerRow: {
    position: 'absolute',
    bottom: 30,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end'
  },
  qrBox: {
    width: 90,
    height: 90,
    border: '1px solid #cbd5e1',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center'
  },
  qrText: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'center'
  },
  verifyText: {
    fontSize: 11,
    color: '#475569',
    textAlign: 'right',
    lineHeight: 1.2
  },
  watermark: {
    position: 'absolute',
    top: '42%',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 72,
    color: '#0b3d9122',
    fontWeight: 'bold',
    transform: 'rotate(-15deg)'
  }
});

export default certificateOnlineStyles;
