import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET - Get all users with pagination
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const statut = searchParams.get('statut') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    const whereClause: any = { role: 'USER' };
    
    if (search) {
      whereClause.OR = [
        { prenom: { contains: search } },
        { nom: { contains: search } },
        { telephone: { contains: search } },
      ];
    }
    
    if (statut !== 'all') {
      whereClause.statut = statut;
    }
    
    const [users, total] = await Promise.all([
      db.user.findMany({
        where: whereClause,
        select: {
          id: true,
          prenom: true,
          nom: true,
          telephone: true,
          adresse: true,
          numeroCNI: true,
          statut: true,
          createdAt: true,
          _count: {
            select: {
              demandes: true,
              remboursements: true,
            }
          },
          demandes: {
            select: {
              id: true,
              montant: true,
              statut: true,
              typePret: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 5,
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.user.count({ where: whereClause }),
    ]);
    
    return NextResponse.json({
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    });
    
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}

// PUT - Update user status
export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }
    
    const { userId, statut } = await request.json();
    
    if (!userId || !statut) {
      return NextResponse.json(
        { error: 'userId et statut sont requis' },
        { status: 400 }
      );
    }
    
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { statut },
      select: {
        id: true,
        prenom: true,
        nom: true,
        statut: true,
      }
    });
    
    return NextResponse.json({
      message: `Utilisateur ${statut === 'ACTIF' ? 'activé' : 'suspendu'} avec succès`,
      user: updatedUser,
    });
    
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}
