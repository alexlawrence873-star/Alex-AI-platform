// Firebase Configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Firebase Services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Firestore References
const usersCollection = db.collection('users');
const paymentsCollection = db.collection('payments');
const membershipCollection = db.collection('memberships');
const imagesCollection = db.collection('images');
const videosCollection = db.collection('videos');
const adminSettingsCollection = db.collection('adminSettings');

// User Classes
class User {
    constructor(uid, email, fullName, phone, createdAt) {
        this.uid = uid;
        this.email = email;
        this.fullName = fullName;
        this.phone = phone;
        this.createdAt = createdAt;
        this.role = 'user';
    }
}

class Payment {
    constructor(userId, amount, method, plan, status = 'pending') {
        this.userId = userId;
        this.amount = amount;
        this.method = method; // 'airtel' or 'tnm'
        this.plan = plan; // 'weekly', 'monthly', 'yearly'
        this.referenceCode = this.generateReferenceCode();
        this.status = status; // 'pending', 'approved', 'rejected'
        this.createdAt = new Date();
        this.transactionId = '';
        this.screenshotUrl = '';
    }

    generateReferenceCode() {
        return 'REF-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    }
}

class Membership {
    constructor(userId, plan, startDate, endDate) {
        this.userId = userId;
        this.plan = plan;
        this.startDate = startDate;
        this.endDate = endDate;
        this.status = 'active';
        this.imageQuota = this.getImageQuota(plan);
        this.videoQuota = this.getVideoQuota(plan);
        this.storageQuota = this.getStorageQuota(plan);
    }

    getImageQuota(plan) {
        const quotas = {
            'weekly': 50,
            'monthly': 500,
            'yearly': 7200
        };
        return quotas[plan] || 0;
    }

    getVideoQuota(plan) {
        const quotas = {
            'weekly': 10,
            'monthly': 100,
            'yearly': 1500
        };
        return quotas[plan] || 0;
    }

    getStorageQuota(plan) {
        const quotas = {
            'weekly': 5,
            'monthly': 50,
            'yearly': 500
        };
        return quotas[plan] || 0;
    }
}

class AdminSettings {
    constructor() {
        this.airtelNumber = '265XXXXXXXXX';
        this.tnmNumber = '265XXXXXXXXX';
        this.weeklyPrice = 2.99;
        this.monthlyPrice = 9.99;
        this.yearlyPrice = 83.99;
    }
}

// Firebase Utility Functions
const FirebaseUtils = {
    // Authentication
    async signup(email, password, fullName, phone) {
        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Create user document
            await usersCollection.doc(user.uid).set({
                uid: user.uid,
                email: email,
                fullName: fullName,
                phone: phone,
                createdAt: new Date(),
                role: 'user',
                profileImage: '',
                verified: false
            });

            return { success: true, user: user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async login(email, password) {
        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async logout() {
        try {
            await auth.signOut();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async resetPassword(email) {
        try {
            await auth.sendPasswordResetEmail(email);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Payment Management
    async createPayment(userId, paymentData) {
        try {
            const paymentRef = paymentsCollection.doc();
            const payment = new Payment(
                userId,
                paymentData.amount,
                paymentData.method,
                paymentData.plan
            );

            await paymentRef.set({
                ...payment,
                paymentId: paymentRef.id,
                fullName: paymentData.fullName,
                email: paymentData.email,
                phone: paymentData.phone
            });

            return { success: true, paymentId: paymentRef.id, referenceCode: payment.referenceCode };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async updatePaymentStatus(paymentId, status, transactionId = '') {
        try {
            await paymentsCollection.doc(paymentId).update({
                status: status,
                transactionId: transactionId,
                updatedAt: new Date()
            });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async uploadScreenshot(paymentId, file) {
        try {
            const fileRef = storage.ref(`payments/${paymentId}/screenshot_${Date.now()}`);
            const snapshot = await fileRef.put(file);
            const url = await snapshot.ref.getDownloadURL();

            await paymentsCollection.doc(paymentId).update({
                screenshotUrl: url
            });

            return { success: true, url: url };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Membership Management
    async createMembership(userId, plan) {
        try {
            const startDate = new Date();
            const endDate = new Date();

            if (plan === 'weekly') endDate.setDate(endDate.getDate() + 7);
            if (plan === 'monthly') endDate.setMonth(endDate.getMonth() + 1);
            if (plan === 'yearly') endDate.setFullYear(endDate.getFullYear() + 1);

            const membership = new Membership(userId, plan, startDate, endDate);

            await membershipCollection.doc(userId).set(membership);
            return { success: true, membership: membership };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async getMembership(userId) {
        try {
            const doc = await membershipCollection.doc(userId).get();
            if (doc.exists) {
                return { success: true, membership: doc.data() };
            }
            return { success: false, error: 'No membership found' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Generated Content
    async saveGeneratedImage(userId, imageData) {
        try {
            await imagesCollection.add({
                userId: userId,
                title: imageData.title,
                prompt: imageData.prompt,
                imageUrl: imageData.imageUrl,
                style: imageData.style,
                createdAt: new Date(),
                downloadCount: 0
            });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async saveGeneratedVideo(userId, videoData) {
        try {
            await videosCollection.add({
                userId: userId,
                title: videoData.title,
                prompt: videoData.prompt,
                videoUrl: videoData.videoUrl,
                type: videoData.type,
                createdAt: new Date(),
                downloadCount: 0
            });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Admin Settings
    async getAdminSettings() {
        try {
            const doc = await adminSettingsCollection.doc('settings').get();
            if (doc.exists) {
                return { success: true, settings: doc.data() };
            }
            return { success: false, error: 'Settings not found' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async updateAdminSettings(settings) {
        try {
            await adminSettingsCollection.doc('settings').set(settings, { merge: true });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};

// Global instance
window.FirebaseUtils = FirebaseUtils;
