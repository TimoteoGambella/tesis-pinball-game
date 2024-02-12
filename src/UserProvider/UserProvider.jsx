import React, {useEffect, useState} from 'react';
import UserContext from './UserContext';
import { APP_DATA } from '../CONSTANTS';
import { createUserDocument, getUserByEmail } from '../firebase/firebase';
import { useNavigate } from 'react-router-dom';

export const UserProvider = ({children}) => {
    const [isLogged, setIsLogged]= useState(false);
    const [userInfo, setUserInfo] = useState({
        email: ''
    })
    const navigate = useNavigate()

    useEffect(() => {
        if(userInfo.email === '') navigate('/')
      }, [userInfo]);

    const validateEmail = (email) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        const validation = regex.test(email);
        return validation
    }   

    const handleLogin = async () => {
        let userInfoCopy = {...userInfo}
        const userResponse = await getUserByEmail(userInfo.email)
        // Check email in firebase
        if(userResponse){
            userInfoCopy = {...userResponse}
        }else{
            let tables = APP_DATA.APP_GAME.GAME_CONFIGURATION.tables
            userInfoCopy.tableAssigned = tables[Math.floor(Math.random() * tables.length)]
            userInfoCopy.date = new Date();
            userInfoCopy.totalPoints = 0
            userInfoCopy.timePlayed = 0
            userInfoCopy.gameCompleted = false
            userInfoCopy.firstForm = {
                isCompleted: false
            }
            userInfoCopy.finalForm = {
                isCompleted: false
            }
            await createUserDocument(userInfoCopy)
        }
        setUserInfo(userInfoCopy)
        setIsLogged(true)
    }

    useEffect(() => {
        console.log(userInfo)
        // let user = localStorage.getItem('userData') === 'undefined' ?  undefined : JSON?.parse(localStorage?.getItem('userData'));
    }, [userInfo]);

    return (
        <UserContext.Provider value={{
            userInfo,
            setUserInfo,
            validateEmail,
            isLogged,
            handleLogin
        }}>
            {children}
        </UserContext.Provider>
    )
}