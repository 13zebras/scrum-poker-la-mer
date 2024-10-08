'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { socketEmitter } from '@/services/socket'
import { useSocketListener } from '@/services/socket'
import type { ListenerRes } from '@/services/socket'
import HostControlButton from '@/components/HostControlButton'
import HostSettingsButton from '@/components/HostSettingsButton'
import RoomMainUi from '@/components/RoomMainUi'
import RoomInfo from '@/components/RoomInfo'
import HostDemoButtons from '@/components/socketIoDevTools/HostDemoButtons'
import useUpdateUsersPoints from '@/utils/hooks/useUpdateUserPoints'

export const POINT_CODES = {
	JOIN: -99,
	HIDE_HOST: -77,
	RESET: -33,
	QUESTION: -1,
}

export default function HostRoom({ params }: { params: { roomId: string } }) {
	const hostCardLocalStorage = localStorage.getItem('scrumDivingShowHostCard')
	const hostCardShow: boolean = hostCardLocalStorage && JSON.parse(hostCardLocalStorage)

	const [showHostCard, setShowHostCard] = useState<boolean>(hostCardShow)
	const { allUsersPointsData, updateUsersPoints } = useUpdateUsersPoints({
		allUsersPointsEmitter,
	})

	// console.log('%c>>> hostCardLocalStorage', 'color: red', hostCardLocalStorage)

	const { roomId } = params

	// NOTE: for demo mode, add '-DEMO-numberDemoUsers'
	// to the roomId
	const demoMode = roomId.includes('DEMO')
	const splitRoomId = roomId.split('-DEMO-')
	const numDemoUsers = splitRoomId[1] ? Number.parseInt(splitRoomId[1]) : 0
	console.log('%c>>> splitRoomId', 'color: red', splitRoomId)

	// NOTE: these values are passed to the story point buttons.
	// The radio buttons will submit one of these values as strings.
	const defaultStoryPointValues = ['?', '0', '1', '2', '3', '5', '8', '13', '20', '40', '100']
	const allowedPointsLocalStorage = localStorage.getItem('scrumDivingAllowedStoryPoints')
	const startingAllowedPoints = allowedPointsLocalStorage
		? JSON.parse(allowedPointsLocalStorage)
		: defaultStoryPointValues

	const [allowedStoryPoints, setAllowedStoryPoints] = useState<string[]>(startingAllowedPoints)

	const hostDataLocalStorage = localStorage.getItem('scrumDivingHostData')
	const hostName = hostDataLocalStorage && JSON.parse(hostDataLocalStorage)?.hostName
	const roomUrl: string = hostDataLocalStorage && JSON.parse(hostDataLocalStorage)?.roomUrl
	const hostRoomUrl: string = hostDataLocalStorage && JSON.parse(hostDataLocalStorage)?.hostRoomUrl

	// emitter for host joining room
	useEffect(() => {
		const hostPoints = showHostCard ? POINT_CODES.JOIN : POINT_CODES.HIDE_HOST
		socketEmitter('join-room', { roomId: roomId, message: hostPoints, userName: hostName })
		localStorage.setItem('scrumDivingShowHostCard', JSON.stringify(showHostCard))
	}, [roomId, hostName, showHostCard])

	useSocketListener('join-room', {
		onChange: (joinRoomRes) => {
			// add imageNumber to the user who joined the room
			// TODO: because of adding and removing host, you need to always find the max imageNumber and add 1 to it to get the next imageNumber.
			const maxImageNumber = allUsersPointsData.reduce(
				(max, user) => (user.imageNumber > max ? user.imageNumber : max),
				allUsersPointsData[0]?.imageNumber ?? 0,
			)
			const userJoinWithImageNumber = {
				...joinRoomRes,
				imageNumber: maxImageNumber + 1,
			}

			updateUsersPoints(userJoinWithImageNumber)

			// TODO consider consolidating host-room-info and
			// allowed-story-points into one emitter.
			// This would require message to use an object like this:
			// { roomUrl: string, allowedPoints: string[] }

			// when someone joins the room, emit allowedStoryPoints
			allowedPointsEmitter(allowedStoryPoints)

			// when someone joins the room, emit hostName & roomUrl
			socketEmitter('host-room-info', {
				roomId: roomId,
				message: roomUrl,
				userName: hostName,
			})
		},
	})

	useSocketListener('user-story-point', {
		onChange: (storyPointRes) => {
			updateUsersPoints(storyPointRes)
		},
	})

	function allowedPointsEmitter(allowedPoints: string[], localStorage = false) {
		const localStorageValue = localStorage ? 'scrumDivingAllowedStoryPoints' : ''
		socketEmitter('allowed-story-points', {
			roomId: roomId,
			message: allowedPoints,
			userName: hostName,
			localStorageName: localStorageValue,
		})
	}

	function allUsersPointsEmitter(allUsersPointsData: ListenerRes[]) {
		socketEmitter('all-users-story-points', {
			roomId: roomId,
			message: allUsersPointsData,
			userName: hostName,
			localStorageName: 'scrumDivingStoryPoints',
		})
	}

	const handleShowPoints = () => {
		socketEmitter('show-disable-reset-points', {
			roomId: roomId,
			message: true as unknown as string,
			userName: hostName,
		})
	}

	const handleClearPoints = () => {
		const clearedPoints = allUsersPointsData.map((data: ListenerRes) => {
			return { ...data, message: POINT_CODES.RESET }
		})
		updateUsersPoints(clearedPoints)
		socketEmitter('show-disable-reset-points', {
			roomId: roomId,
			message: false as unknown as string,
			userName: hostName,
		})
	}

	return (
		<main className='px-16 py-12 relative flex flex-col justify-start items-center gap-8 w-full animate-in fade-in-0 duration-1000'>
			<div className='flex flex-col justify-start items-center gap-6'>
				<h1 className='text-3xl text-gray-300'>Host: Scrum Under the Sea</h1>
				<RoomInfo roomUrl={roomUrl} hostName={hostName} />
			</div>
			<div className='pt-2 w-full flex flex-col justify-start items-center gap-12'>
				<div className='flex flex-row justify-between items-start self-end gap-x-12'>
					<div className='flex flex-row flex-wrap-reverse justify-end items-center gap-x-8 gap-y-4'>
						<HostControlButton handler={handleShowPoints} color='success'>
							Show points
						</HostControlButton>
						<HostControlButton handler={handleClearPoints} color='error'>
							Clear Points
						</HostControlButton>
					</div>
				</div>
				<RoomMainUi roomId={roomId} userName={hostName} />
			</div>

			<div className='absolute top-4 right-16'>
				<HostSettingsButton
					hostRoomUrl={hostRoomUrl}
					roomUrl={roomUrl}
					allowedPointsEmitter={allowedPointsEmitter}
					defaultStoryPointValues={defaultStoryPointValues}
					allowedStoryPoints={allowedStoryPoints}
					setAllowedStoryPoints={setAllowedStoryPoints}
					showHostCard={showHostCard}
					setShowHostCard={setShowHostCard}
				/>
			</div>
			<div className='absolute top-4 left-12 flex flex-row flex-start items-center gap-8 scale-90'>
				<Link href='/host' className='btn btn-outline-gray h-6 min-h-6 w-28 px-1 text-xs'>
					Create Room
				</Link>
				{demoMode && (
					<HostDemoButtons
						allUsersPoints={allUsersPointsData}
						updateUsersPoints={updateUsersPoints}
						numDemoUsers={numDemoUsers}
					/>
				)}
			</div>
		</main>
	)
}
