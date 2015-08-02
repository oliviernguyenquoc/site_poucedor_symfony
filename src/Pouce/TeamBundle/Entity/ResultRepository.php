<?php

namespace Pouce\TeamBundle\Entity;

use Doctrine\ORM\EntityRepository;

/**
 * ResultRepository
 *
 * This class was generated by the Doctrine ORM. Add your own custom
 * repository methods below.
 */
class ResultRepository extends EntityRepository
{
	// To get all informations for the ranking
	public function getAllResultsInEdition($idEdition)
	{
		$qb = $this	-> createQueryBuilder('r')
					-> where('r.edition = :idEdition')
                     ->setParameter('idEdition', $idEdition)
                    -> join('r.team','t')
                    -> addSelect('t')
                    -> join('t.users','u') //Il faut assurer la jointure (voir s'il y a pas moyen de faire autrement qu'une relation bidirectionnel)
                    -> addSelect('u')
                    -> join('u.school','s')
                    -> addSelect('s')
                    -> join('r.position','p')
                    -> addSelect('p')
                    -> orderBy('p.distance','DESC');

		return $qb->getQuery()->getResult();
	}	
	
	// TODO : FINIR
	public function getAllTeamsBySchool($idEdition, $idEcole)
	{
		$qb = $this -> getAllResultsInEdition($idEdition)
					-> where('s.id = :idEcole')
					 ->setParameter('idEcole', $idEcole);
	}

	/*
		TODO : Dans la vue, il faut afficher chaque résultat de la requette
		team par team. Puis appliquer un filtre, si l'on veut faire des classements
		différents par type d'équipe (H-H, F-M, F-F)

		Puis il faut gerer les redondances de classement 
	*/

	// Récupère le résult d'une team
	public function getResultTeam($team)
	{
		$qb = $this	-> createQueryBuilder('r')
					-> where('r.team = :idTeam')
					 ->setParameter('idTeam', $team->getId());

		return $qb->getQuery();
	}
}
