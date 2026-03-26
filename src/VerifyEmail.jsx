import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  auth,
  db,
  sendEmailVerification,
  onAuthStateChanged,
  doc,
  getDoc,
  updateDoc,
} from './firebase';
import './style/verify-email.css';

function VerifyEmail() {
  const [userEmail, setUserEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return navigate('/');

      setUserEmail(user.email);

      if (!user.emailVerified) {
        const created = new Date(user.metadata.creationTime);
        const signedIn = new Date(user.metadata.lastSignInTime);
        const isNew = signedIn - created < 10000;

        if (isNew) {
          try {
            await sendEmailVerification(user);
            alert(`Verification email sent to ${user.email}`);
          } catch (error) {
            console.error('Error sending verification email:', error);
          }
        }
      } else {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userRef);

          if (userDoc.exists()) {
            await updateDoc(userRef, { status: 'pending' });
            navigate('/login');
          }
        } catch (error) {
          console.error('Error updating Firestore:', error);
        }
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleResend = async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        await sendEmailVerification(user);
        alert(`Verification email re-sent to ${user.email}`);
      } catch (error) {
        console.error('Error re-sending verification email:', error);
      }
    }
  };

  return (
    <div className="verify-container">
      <div className="verify-card">
        <h2>Email Verification</h2>
        <p>
          A verification email has been sent to:
          <br />
          <strong>{userEmail}</strong>
        </p>
        <p>Please check your inbox and click the verification link. Please refresh the page once link is clicked</p>

        <button className="btn solid" onClick={handleResend}>
          Re-send Email
        </button>

        <p className="already-verified">
          Already verified?{' '}
          <button className="link-btn" onClick={() => navigate('/login')}>
            Return to Login
          </button>
        </p>
      </div>
    </div>
  );
}

export default VerifyEmail;