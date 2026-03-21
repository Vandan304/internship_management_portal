import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Trophy, Medal, Award, TrendingUp, User as UserIcon } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { cn } from '../utils/cn';

import medal1 from '../assets/medals/medal_1.png';
import medal2 from '../assets/medals/medal_2.png';
import medal3 from '../assets/medals/medal_3.png';

const medalMap = {
    1: medal1,
    2: medal2,
    3: medal3
};

export default function Leaderboard() {
    const { leaderboardData } = useData();
    const { user } = useAuth();
    const { top3, fullList } = leaderboardData;

    const currentUserRank = fullList.find(i => i.id === (user?._id || user?.id) || i.internId === user?.internId);

    const isAdmin = user?.role === 'admin';

    return (
        <div className="space-y-8 animate-fade-in-up overflow-y-auto scrollbar-hide h-full pb-12 pr-2">

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Trophy size={32} className="text-yellow-500 fill-yellow-500" />
                        Performance Leaderboard
                    </h2>
                    <p className="text-gray-500 mt-1 text-sm">Recognizing our top performing interns based on task excellence.</p>
                </div>
                {!isAdmin && currentUserRank && (
                    <div className={cn(
                        "px-6 py-3 rounded-2xl flex items-center gap-4 shadow-sm border",
                        currentUserRank.rank <= 3 ? "bg-transparent border-yellow-200" : "bg-brand-50 border-brand-100"
                    )}>
                        {currentUserRank.rank <= 3 ? (
                            <img src={medalMap[currentUserRank.rank]} alt="Rank Medal" className="w-8 h-8 object-contain" />
                        ) : (
                            <TrendingUp className="text-brand-600" size={24} />
                        )}
                        <div>
                            <p className={cn(
                                "text-xs font-semibold uppercase tracking-wider",
                                currentUserRank.rank <= 3 ? "text-yellow-700" : "text-brand-600"
                            )}>Your Standing</p>
                            <p className="text-lg font-bold text-gray-900">
                                Rank #{currentUserRank.rank}
                                {currentUserRank.rank <= 3 && <span className="ml-2 text-sm font-black text-yellow-600 uppercase italic">Top Performer!</span>}
                                <span className={cn("ml-2 font-medium", currentUserRank.rank <= 3 ? "text-yellow-700" : "text-brand-600")}>
                                    • {currentUserRank.points} pts
                                </span>
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {isAdmin ? (
                <>
                    {/* Top 3 Podium Section (Admin Only) */}
                    {top3.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-12">
                            {/* 2nd Place */}
                            {top3[1] && (
                                <div className="order-2 md:order-1">
                                    <PodiumCard
                                        intern={top3[1]}
                                        rank={2}
                                        color="text-slate-400"
                                        bgColor="bg-transparent"
                                        borderColor="border-slate-200"
                                        icon={<img src={medal2} alt="Silver Medal" className="w-16 h-16 object-contain" />}
                                        height="h-64"
                                    />
                                </div>
                            )}
                            {/* 1st Place */}
                            {top3[0] && (
                                <div className="order-1 md:order-2">
                                    <PodiumCard
                                        intern={top3[0]}
                                        rank={1}
                                        color="text-yellow-600"
                                        bgColor="bg-transparent"
                                        borderColor="border-yellow-200"
                                        icon={<img src={medal1} alt="Gold Medal" className="w-20 h-20 object-contain" />}
                                        height="h-80"
                                        isLarge
                                    />
                                </div>
                            )}
                            {/* 3rd Place */}
                            {top3[2] && (
                                <div className="order-3">
                                    <PodiumCard
                                        intern={top3[2]}
                                        rank={3}
                                        color="text-amber-700"
                                        bgColor="bg-transparent"
                                        borderColor="border-amber-200"
                                        icon={<img src={medal3} alt="Bronze Medal" className="w-16 h-16 object-contain" />}
                                        height="h-56"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Rankings Table (Admin Only) */}
                    <Card className="border-none shadow-xl overflow-hidden">
                        <CardHeader className="bg-brand-50/30 border-b border-brand-100/50">
                            <CardTitle className="text-lg font-bold text-brand-900 flex items-center gap-2">
                                <TrendingUp size={20} className="text-brand-600" />
                                All Intern Rankings
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-brand-50/20 text-xs font-bold text-brand-700 uppercase tracking-wider">
                                        <tr>
                                            <th className="px-8 py-4">Rank</th>
                                            <th className="px-8 py-4">Intern Details</th>
                                            <th className="px-8 py-4">Domain</th>
                                            <th className="px-8 py-4 text-right">Points</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {fullList.map((intern) => (
                                            <tr
                                                key={intern.id}
                                                className={cn(
                                                    "transition-colors group",
                                                    intern.id === user?.id || intern.internId === user?.internId
                                                        ? "bg-brand-50/40 hover:bg-brand-50/60"
                                                        : "hover:bg-gray-50/50"
                                                )}
                                            >
                                                <td className="px-8 py-5">
                                                    <div className={cn(
                                                        "w-10 h-10 flex items-center justify-center font-bold text-sm",
                                                        intern.rank <= 3 ? "" : "bg-brand-50 text-brand-400 rounded-xl"
                                                    )}>
                                                        {intern.rank <= 3 ? (
                                                            <img src={medalMap[intern.rank]} alt={`Rank ${intern.rank}`} className="w-8 h-8 object-contain" />
                                                        ) : (
                                                            `#${intern.rank}`
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-4 text-sm font-medium text-gray-900">
                                                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 overflow-hidden">
                                                            <UserIcon size={20} />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold">{intern.name}</p>
                                                            <p className="text-xs text-gray-400 font-normal uppercase">{intern.internId}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className="px-3 py-1 bg-white border border-gray-200 text-gray-600 rounded-full text-xs font-semibold shadow-sm">
                                                        {intern.internRole}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 text-right font-bold text-gray-900">
                                                    <span className="text-xl text-brand-600 font-black">{intern.points}</span>
                                                    <span className="text-[10px] text-brand-400 ml-1 uppercase font-bold tracking-tighter">pts</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </>
            ) : (
                /* Empty space or additional info for interns if they aren't Top 3 */
                <div className="pt-8">
                    {currentUserRank?.rank <= 3 ? (
                        <div className="bg-gradient-to-br from-brand-500 to-brand-700 p-8 rounded-3xl text-white shadow-2xl shadow-brand-100">
                            <div className="flex items-center gap-6">
                                <div className="p-4 rounded-2xl">
                                    <img src={medalMap[currentUserRank.rank]} alt="Trophy" className="w-16 h-16 object-contain" />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black italic">Congratulations!</h3>
                                    <p className="opacity-90 mt-1 font-medium">You are among the top 3 performers on the leaderboard.</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white border border-gray-100 p-8 rounded-3xl text-center shadow-sm">
                            <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-6 text-brand-600">
                                <TrendingUp size={40} />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900">Keep it up!</h3>
                            <p className="text-gray-500 max-w-sm mx-auto mt-2 italic">Complete more tasks ahead of time to climb up the rankings and reach the top 3!</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function PodiumCard({ intern, rank, color, bgColor, borderColor, icon, height, isLarge = false }) {
    return (
        <div className={cn(
            "relative flex flex-col items-center p-8 rounded-[32px] border-2 transition-transform hover:-translate-y-2 group shadow-lg",
            height,
            bgColor,
            borderColor,
            isLarge ? "shadow-yellow-100 scale-105 z-10" : "shadow-gray-100"
        )}>
            <div className={cn("mb-4", color)}>
                {icon}
            </div>

            <div className="text-center">
                <h3 className="font-black text-gray-900 text-lg line-clamp-1">{intern.name}</h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-4">{intern.internRole}</p>
            </div>

            <div className="mt-auto text-center">
                <p className="text-3xl font-black text-gray-900 leading-none">{intern.points}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-1">Total Points</p>
            </div>

            <div className={cn(
                "absolute -top-5 left-1/2 -translate-x-1/2 w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl border-4 border-white shadow-xl",
                rank === 1 ? "bg-yellow-500 text-white" :
                    rank === 2 ? "bg-slate-400 text-white" :
                        "bg-amber-700 text-white"
            )}>
                {rank}
            </div>
        </div>
    );
}