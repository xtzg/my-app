import React, { useState } from 'react';
import {
    Box,
    Button,
    Container,
    CssBaseline,
    TextField,
    Typography,
    ThemeProvider,
    createTheme,
    Tabs,
    Tab,
    Divider,
    IconButton,
    InputAdornment
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import ChatIcon from '@mui/icons-material/Chat';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import axios from 'axios';

// 定义登录表单数据类型
interface LoginFormData {
    username: string;
    password: string;
    phone?: string;
    verificationCode?: string;
}

// 创建自定义主题
const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#4FC3F7', // 更亮的蓝色
        },
        secondary: {
            main: '#FF4081', // 鲜艳的粉色
        },
        background: {
            paper: 'rgba(17, 25, 40, 0.75)', // 半透明深色背景
        },
        text: {
            primary: '#FFFFFF',
            secondary: 'rgba(255, 255, 255, 0.7)',
        },
    },
    typography: {
        fontFamily: 'Roboto, Arial, sans-serif',
    },
    components: {
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                            borderColor: 'rgba(255, 255, 255, 0.23)',
                        },
                        '&:hover fieldset': {
                            borderColor: '#4FC3F7',
                        },
                        '&.Mui-focused fieldset': {
                            borderColor: '#4FC3F7',
                        },
                        backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    },
                    '& label': {
                        color: 'rgba(255, 255, 255, 0.7)',
                    },
                    '& input': {
                        color: '#FFFFFF',
                    },
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontSize: '1rem',
                },
            },
        },
        MuiDivider: {
            styleOverrides: {
                root: {
                    '&::before, &::after': {
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                },
            },
        },
    },
});

const LoginForm: React.FC = () => {
    const [formData, setFormData] = useState<LoginFormData>({
        username: '',
        password: '',
        phone: '',
        verificationCode: ''
    });
    const [loading, setLoading] = useState(false);
    const [loginMode, setLoginMode] = useState<'account' | 'phone'>('account');
    const [isLogin, setIsLogin] = useState(true);
    const [countdown, setCountdown] = useState(0);

    // 处理登录模式切换
    const handleModeChange = (event: React.SyntheticEvent, newMode: 'account' | 'phone') => {
        setLoginMode(newMode);
    };

    // 处理表单提交
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const endpoint = isLogin ? '/api/login' : '/api/register';
            const response = await axios.post(endpoint, {
                ...formData,
                loginMode
            });

            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                console.log(isLogin ? '登录成功' : '注册成功');
            }
        } catch (error) {
            console.error(isLogin ? '登录失败' : '注册失败', error);
        } finally {
            setLoading(false);
        }
    };

    // 处理输入变化
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // 处理发送验证码
    const handleSendVerificationCode = async () => {
        if (!formData.phone || countdown > 0) return;

        try {
            await axios.post('/api/send-verification-code', {
                phone: formData.phone
            });

            let count = 60;
            setCountdown(count);

            const timer = setInterval(() => {
                count--;
                setCountdown(count);
                if (count === 0) {
                    clearInterval(timer);
                }
            }, 1000);
        } catch (error) {
            console.error('发送验证码失败', error);
        }
    };

    // 处理社交媒体登录
    const handleSocialLogin = async (platform: 'wechat' | 'qq') => {
        try {
            const response = await axios.get(`/api/oauth/${platform}`);
            window.location.href = response.data.authUrl;
        } catch (error) {
            console.error(`${platform}登录失败`, error);
        }
    };

    return (
        <ThemeProvider theme={theme}>
            <Container component="main" maxWidth="xs">
                <CssBaseline />
                <Box
                    sx={{
                        marginTop: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        backgroundColor: 'rgba(17, 25, 40, 0.75)',
                        backdropFilter: 'blur(16px)',
                        padding: 3,
                        borderRadius: 2,
                        border: '1px solid rgba(255, 255, 255, 0.125)',
                        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
                    }}
                >
                    <LockOutlinedIcon sx={{ fontSize: 40, color: '#4FC3F7' }} />
                    <Typography
                        component="h1"
                        variant="h5"
                        sx={{
                            mt: 2,
                            color: '#FFFFFF',
                            fontWeight: 600,
                            textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }}
                    >
                        {isLogin ? '用户登录' : '用户注册'}
                    </Typography>

                    <Tabs
                        value={loginMode}
                        onChange={handleModeChange}
                        sx={{
                            mt: 2,
                            mb: 2,
                            '& .MuiTabs-indicator': {
                                backgroundColor: '#4FC3F7',
                            },
                        }}
                    >
                        <Tab
                            value="account"
                            label="账号密码"
                            sx={{
                                color: 'rgba(255, 255, 255, 0.7)',
                                '&.Mui-selected': {
                                    color: '#4FC3F7',
                                    fontWeight: 'bold',
                                },
                            }}
                        />
                        <Tab
                            value="phone"
                            label="手机验证码"
                            sx={{
                                color: 'rgba(255, 255, 255, 0.7)',
                                '&.Mui-selected': {
                                    color: '#4FC3F7',
                                    fontWeight: 'bold',
                                },
                            }}
                        />
                    </Tabs>

                    <Box
                        component="form"
                        onSubmit={handleSubmit}
                        sx={{
                            mt: 1,
                            width: '100%',
                        }}
                    >
                        {loginMode === 'account' ? (
                            <>
                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    label="用户名"
                                    name="username"
                                    autoComplete="username"
                                    autoFocus
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    variant="outlined"
                                />
                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    name="password"
                                    label="密码"
                                    type="password"
                                    autoComplete="current-password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    variant="outlined"
                                />
                            </>
                        ) : (
                            <>
                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    label="手机号"
                                    name="phone"
                                    autoComplete="tel"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    variant="outlined"
                                />
                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    name="verificationCode"
                                    label="验证码"
                                    value={formData.verificationCode}
                                    onChange={handleInputChange}
                                    variant="outlined"
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <Button
                                                    onClick={handleSendVerificationCode}
                                                    disabled={countdown > 0 || !formData.phone}
                                                >
                                                    {countdown > 0 ? `${countdown}秒后重试` : '获取验证码'}
                                                </Button>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </>
                        )}

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            disabled={loading}
                            sx={{
                                mt: 3,
                                mb: 2,
                                py: 1.5,
                                backgroundColor: '#4FC3F7',
                                '&:hover': {
                                    backgroundColor: '#0095e8',
                                },
                                fontWeight: 'bold',
                            }}
                        >
                            {loading ? '处理中...' : (isLogin ? '登录' : '注册')}
                        </Button>

                        <Button
                            fullWidth
                            sx={{
                                mb: 2,
                                color: '#4FC3F7',
                                '&:hover': {
                                    backgroundColor: 'rgba(79, 195, 247, 0.08)',
                                },
                            }}
                            onClick={() => setIsLogin(!isLogin)}
                        >
                            {isLogin ? '没有账号？立即注册' : '已有账号？立即登录'}
                        </Button>

                        <Divider sx={{ mb: 2, color: 'rgba(255, 255, 255, 0.7)' }}>
                            社交账号登录
                        </Divider>

                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                            <IconButton
                                onClick={() => handleSocialLogin('wechat')}
                                sx={{
                                    backgroundColor: 'rgba(7, 193, 96, 0.9)',
                                    color: 'white',
                                    '&:hover': {
                                        backgroundColor: '#07C160',
                                    },
                                    transition: 'all 0.3s ease',
                                    backdropFilter: 'blur(4px)',
                                }}
                            >
                                <ChatIcon />
                            </IconButton>
                            <IconButton
                                onClick={() => handleSocialLogin('qq')}
                                sx={{
                                    backgroundColor: 'rgba(18, 183, 245, 0.9)',
                                    color: 'white',
                                    '&:hover': {
                                        backgroundColor: '#12B7F5',
                                    },
                                    transition: 'all 0.3s ease',
                                    backdropFilter: 'blur(4px)',
                                }}
                            >
                                <QrCode2Icon />
                            </IconButton>
                        </Box>
                    </Box>
                </Box>
            </Container>
        </ThemeProvider>
    );
};

export default LoginForm;